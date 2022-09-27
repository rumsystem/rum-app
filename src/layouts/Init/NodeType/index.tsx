import React from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { lang } from 'utils/lang';
import { migrate } from 'standaloneModals/migrate';
import BxTripIcon from 'assets/bx-trip.svg';
import RumIcon from 'assets/icon.png';
import RumText from 'assets/rumsystem_text.svg';
import IconLangLocal from 'assets/lang_local_2.svg';
import { DropdownMenu, MenuItem } from 'components/DropdownMenu';
import { i18n, AllLanguages } from 'store/i18n';
import { observer } from 'mobx-react-lite';

type NodeType = 'login' | 'signup' | 'proxy' | 'wasm';

interface Props {
  onSelect: (v: NodeType) => unknown
}

export const NodeType = observer((props: Props) => {
  const list = [
    !!process.env.IS_ELECTRON && { type: 'signup', text1: lang.signupNode, text2: lang.signupNodeTip },
    !!process.env.IS_ELECTRON && { type: 'login', text1: lang.loginNode, text2: lang.loginNodeTip },
    !!process.env.IS_ELECTRON && { type: 'proxy', text1: lang.externalNode, text2: lang.externalNodeTip },
    !process.env.IS_ELECTRON && { type: 'wasm', text1: lang.wasmNode, text2: lang.wasmNodeTip },
  ].filter(<T extends unknown>(v: T | false): v is T => !!v);

  const langMenu: MenuItem = {
    text: lang.switchLang,
    icon: IconLangLocal,
    iconText: lang.language,
    children: [
      {
        text: 'English',
        checked: i18n.state.lang === 'en',
        classNames: 'ml-2 pl-5',
        action: () => {
          i18n.switchLang('en' as AllLanguages);
        },
      },
      {
        text: '简体中文',
        checked: i18n.state.lang === 'cn',
        classNames: 'ml-2 pl-5',
        action: () => {
          i18n.switchLang('cn' as AllLanguages);
        },
      },
    ],
  };

  return (
    <div className="w-[720px] pb-[50px]">
      <img
        className="w-[59px] mx-auto mb-[41px]"
        src={RumIcon}
        alt="Rum"
      />
      <div className="h-[408px] bg-black opacity-80 px-[164px] pt-[57px] pb-[45px] flex relative">
        <div className="box-content w-full flex flex-col justify-center gap-y-[37px]">
          {list.map((v) => (
            <div
              className="border-b-2 border-gray-9c pb-5 flex items-center justify-between cursor-pointer"
              key={v.type}
              onClick={() => props.onSelect(v.type as NodeType)}
            >
              <div className="flex-grow flex items-center justify-between">
                <div className="text-white text-18 font-medium">{v.text1}</div>
                <div className="text-gray-af text-16 tracking-wide">{v.text2}</div>
              </div>
              <BiChevronRight className="text-gray-bd text-32" />
            </div>
          ))}
          <div
            className="self-center w-[140px] border border-gray-9c py-[10px] flex items-center gap-x-[20px] justify-center cursor-pointer"
            onClick={() => { migrate(); }}
          >
            <img className="" src={BxTripIcon} alt={lang.migrate} />
            <div className="text-white text-16">{lang.migrate}</div>
          </div>
        </div>
        <DropdownMenu className="absolute top-[20px] right-[21px] text-[#5fc0e9]" menu={langMenu} />
      </div>
      <img
        className="w-[337px] mx-auto mt-[25px]"
        src={RumText}
        alt="Rumsystem"
      />
    </div>
  );
});
