import React from 'react';
import { action, autorun, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { ClickAwayListener, Grow, Popper, PopperProps } from '@material-ui/core';
import { emojis } from './emoji';
import { lang } from './lang';

interface Props extends Omit<PopperProps, 'children'> {
  onSelectEmoji?: (emoji: string) => unknown
  onClose?: () => unknown
}

const RECENT_EMOJI_STORAGE_KEY = 'RECENT_EMOJI_LIST';

const EmojiPickerPopper = observer((props: Props & { children: React.ReactElement }) => {
  const state = useLocalObservable(() => ({
    open: false,
  }));

  const { onSelectEmoji, open, ...popoverProps } = props;

  const handleClickAway = () => {
    if (state.open) {
      props.onClose?.();
    }
  };

  React.useEffect(action(() => {
    state.open = props.open;
  }), [props.open]);

  return (
    <Popper
      {...popoverProps}
      open={state.open}
      transition
      placement="bottom-start"
    >
      {({ TransitionProps }) => (
        <ClickAwayListener onClickAway={handleClickAway}>
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: 'top left',
            }}
          >
            {props.children}
          </Grow>
        </ClickAwayListener>
      )}
    </Popper>
  );
});

export const EmojiPicker = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    category: 0,
    categoryBoxes: [] as Array<HTMLDivElement>,
    recent: ['😀'] as Array<string>,
  }));
  const { onSelectEmoji } = props;

  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollBox.current) {
      return;
    }
    const scrollTop = scrollBox.current.scrollTop;
    if (state.recent.length && scrollTop < state.categoryBoxes[1].offsetTop - 1) {
      runInAction(() => {
        state.category = 0;
      });
      return;
    }
    const position = state.categoryBoxes
      .map((v) => v.offsetTop - scrollTop)
      .map((v, i) => [v, i])
      .filter((v) => v[0] < 150)
      .reverse()[0][1];

    runInAction(() => {
      state.category = position;
    });
  };

  const handleScrollTo = (i: number) => {
    const box = state.categoryBoxes[i];
    if (!scrollBox.current || !box) {
      return;
    }

    scrollBox.current.scrollTo({
      top: box.offsetTop,
      behavior: 'smooth',
    });
  };

  const handleSelect = action((e: string) => {
    onSelectEmoji?.(e);
    if (state.recent.some((v) => v === e)) {
      state.recent.splice(state.recent.indexOf(e), 1);
    }
    state.recent.unshift(e);
    if (state.recent.length > 9) {
      state.recent.length = 9;
    }
  });

  const loadRecentEmoji = action(() => {
    try {
      state.recent = JSON.parse(localStorage.getItem(RECENT_EMOJI_STORAGE_KEY) || '');
    } catch (e) {}
  });

  React.useEffect(() => {
    loadRecentEmoji();

    return autorun(() => {
      localStorage.setItem(RECENT_EMOJI_STORAGE_KEY, JSON.stringify(state.recent));
    });
  }, []);

  React.useEffect(action(() => {
    if (props.open) {
      loadRecentEmoji();
      state.category = 0;
    }
  }), [props.open]);

  return (<>
    <EmojiPickerPopper {...props}>
      <div className="bg-white shadow-4 rounded">
        <div className="relative border-b flex text-20">
          <div
            className="flex flex-center w-9 h-10 pb-1 select-none cursor-pointer hover:bg-gray-ec"
            onClick={() => scrollBox.current!.scrollTo({ top: 0, behavior: 'smooth' })}
            title={lang.recent}
          >
            🕒
          </div>
          {emojis.map((v, i) => (
            <div
              className="flex flex-center w-9 h-10 pb-1 select-none cursor-pointer hover:bg-gray-ec"
              key={v.id}
              onClick={() => handleScrollTo(i + 1)}
              title={lang[v.id]}
            >
              {v.title}
            </div>
          ))}
          <div
            className="absolute h-[3px] w-9 bottom-0 bg-red-400 duration-200"
            style={{
              left: state.category * 36,
            }}
          />
        </div>
        <div
          className="relative bg-white flex flex-col w-auto h-[300px] overflow-x-hidden overflow-y-auto"
          ref={scrollBox}
          onScroll={handleScroll}
        >
          <div>
            <div
              className="py-px mt-1 pl-2 text-14 text-gray-4a font-bold"
              ref={(ref) => { if (ref) { runInAction(() => { state.categoryBoxes[0] = ref; }); } }}
            >
              {lang.recent}
            </div>
            <div className="grid text-20 justify-center w-[324px] select-none">
              {state.recent.map((e) => (
                <div
                  className="flex flex-center w-9 h-9 pb-[2px] cursor-pointer hover:bg-gray-ec overflow-hidden"
                  key={e}
                  onClick={() => handleSelect(e)}
                >
                  {e}
                </div>
              ))}
            </div>
          </div>
          {emojis.map((c, i) => (
            <div
              key={c.id}
              ref={(ref) => { if (ref) { runInAction(() => { state.categoryBoxes[i + 1] = ref; }); } }}
            >
              <div className="py-px mt-1 pl-2 text-14 text-gray-4a font-bold">
                {lang[c.id]}
              </div>
              <div className="grid text-20 justify-center w-[324px] select-none">
                {c.emojis.map((e) => (
                  <div
                    className="flex flex-center w-9 h-9 pb-[2px] cursor-pointer hover:bg-gray-ec overflow-hidden"
                    key={e}
                    onClick={() => handleSelect(e)}
                  >
                    {e}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmojiPickerPopper>

    <style jsx>{`
      .grid {
        grid-template-columns: repeat(auto-fill, 36px);
      }
    `}</style>
  </>);
});
