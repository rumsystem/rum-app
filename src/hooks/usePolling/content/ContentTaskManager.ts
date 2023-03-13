import { store } from 'store';
import sleep from 'utils/sleep';
import { fetchContentsTask } from './fetchContent';

export class ContentTaskManager {
  private saturateMap: Map<string, boolean> = new Map();
  private jumpInQueue: Array<string> = [];
  private idleMode = false;
  private loopRunning = false;
  private advanceResolve = () => {};
  private stopFlag = false;
  private history: Array<string> = [];

  get running() { return this.loopRunning; }

  /** start looping */
  public start() {
    this.loop();
  }

  /** skipping waitting for inverval and start next job if possible */
  public advance() {
    this.advanceResolve();
  }

  /** make a group jump in line at first position and advance to it */
  public jumpIn(groupId: string) {
    const index = this.jumpInQueue.indexOf(groupId);
    if (index !== -1) {
      this.jumpInQueue.splice(index, 1);
    }
    this.jumpInQueue.unshift(groupId);
    this.saturateMap.set(groupId, false);
    this.checkIdleMode();
    console.log('jump in and change to active mode');
    this.advance();
  }

  /** stop the loop (cannot be restarted after) */
  public stop() {
    this.stopFlag = true;
  }

  private async loop() {
    if (this.loopRunning) { return; }
    this.loopRunning = true;
    for (;;) {
      if (this.stopFlag) { break; }
      await this.job();
      if (this.jumpInQueue.length) {
        await this.sleep(500);
      } else if (this.idleMode) {
        await this.sleep(5000);
      } else {
        await this.sleep(500);
      }
    }
    this.loopRunning = false;
  }

  private async job() {
    const groupId = this.getNextGroup();
    if (!groupId) {
      await sleep(1000);
      return [];
    }

    const contents = await fetchContentsTask(groupId);
    if (!contents.length) {
      this.saturateMap.set(groupId, true);
      this.checkIdleMode();
    }
    return contents;
  }

  private getNextGroup() {
    const { groupStore, activeGroupStore } = store;
    const getGroupId = () => {
      // jumped in groupId
      while (this.jumpInQueue.length) {
        const groupId = this.jumpInQueue.shift()!;
        if (groupStore.groups.some((v) => v.group_id === groupId)) {
          return groupId;
        }
      }

      // non-idle mode (prioritize active group)
      if (!this.idleMode) {
        if (activeGroupStore.id && !this.isSaturated(activeGroupStore.id)) {
          return activeGroupStore.id;
        }
        return groupStore.groups.find((v) => !this.isSaturated(v.group_id))?.group_id ?? '';
      }

      // idle mode (just loop all groups)
      const item = groupStore.groups
        .map((group) => {
          const index = this.history.indexOf(group.group_id);
          const priority = index === -1 ? Number.MAX_SAFE_INTEGER : index;
          return {
            group,
            priority,
          };
        })
        .sort((a, b) => b.priority - a.priority)
        .at(0);

      return item?.group.group_id ?? '';
    };

    const groupId = getGroupId();
    if (groupId) {
      console.log(`polling ${groupStore.map[groupId].group_name}`);
      this.history.unshift(groupId);
      if (this.history.length > 150) {
        this.history.length = 100;
      }
    }
    return groupId;
  }

  private checkIdleMode() {
    const { groupStore } = store;
    const idleNow = this.idleMode;
    this.idleMode = groupStore.groups.every((v) => this.isSaturated(v.group_id));
    if (!idleNow && this.idleMode) {
      console.log('change to idle mode');
    }
    if (idleNow && !this.idleMode) {
      console.log('change to active mode');
    }
  }

  private sleep(time: number) {
    return new Promise<void>((rs) => {
      this.advanceResolve = rs;
      setTimeout(rs, time);
    });
  }

  private isSaturated(groupId: string) {
    return !!this.saturateMap.get(groupId);
  }
}
