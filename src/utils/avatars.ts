
import defaultAvatar from 'assets/default_avatar.png';
import avatar1 from 'assets/avatar/1.png';
import avatar2 from 'assets/avatar/2.png';
import avatar3 from 'assets/avatar/3.png';
import avatar4 from 'assets/avatar/4.png';
import avatar5 from 'assets/avatar/5.png';
import avatar6 from 'assets/avatar/6.png';
import avatar7 from 'assets/avatar/7.png';
import avatar8 from 'assets/avatar/8.png';
import avatar9 from 'assets/avatar/9.png';
import avatar10 from 'assets/avatar/10.png';
import avatar11 from 'assets/avatar/11.png';
import avatar12 from 'assets/avatar/12.png';
import avatar13 from 'assets/avatar/13.png';
import avatar14 from 'assets/avatar/14.png';
import avatar15 from 'assets/avatar/15.png';
import avatar16 from 'assets/avatar/16.png';
import avatar17 from 'assets/avatar/17.png';
import avatar18 from 'assets/avatar/18.png';
import avatar19 from 'assets/avatar/19.png';
import avatar20 from 'assets/avatar/20.png';
import avatar21 from 'assets/avatar/21.png';
import avatar22 from 'assets/avatar/22.png';
import avatar23 from 'assets/avatar/23.png';
import avatar24 from 'assets/avatar/24.png';
import avatar25 from 'assets/avatar/25.png';
import avatar26 from 'assets/avatar/26.png';
import avatar27 from 'assets/avatar/27.png';
import avatar28 from 'assets/avatar/28.png';
import avatar29 from 'assets/avatar/29.png';
import avatar30 from 'assets/avatar/30.png';
import avatar31 from 'assets/avatar/31.png';
import avatar32 from 'assets/avatar/32.png';
import avatar33 from 'assets/avatar/33.png';
import avatar34 from 'assets/avatar/34.png';
import avatar35 from 'assets/avatar/35.png';
import avatar36 from 'assets/avatar/36.png';
import avatar37 from 'assets/avatar/37.png';
import avatar38 from 'assets/avatar/38.png';
import avatar39 from 'assets/avatar/39.png';
import avatar40 from 'assets/avatar/40.png';
import avatar41 from 'assets/avatar/41.png';
import avatar42 from 'assets/avatar/42.png';
import avatar43 from 'assets/avatar/43.png';
import avatar44 from 'assets/avatar/44.png';
import avatar45 from 'assets/avatar/45.png';
import avatar46 from 'assets/avatar/46.png';
import avatar47 from 'assets/avatar/47.png';
import avatar48 from 'assets/avatar/48.png';
import avatar49 from 'assets/avatar/49.png';
import avatar50 from 'assets/avatar/50.png';
import avatar51 from 'assets/avatar/51.png';
import avatar52 from 'assets/avatar/52.png';
import avatar53 from 'assets/avatar/53.png';
import avatar54 from 'assets/avatar/54.png';

export const avatars = [
  avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8,
  avatar9, avatar10, avatar11, avatar12, avatar13, avatar14, avatar15,
  avatar16, avatar17, avatar18, avatar19, avatar20, avatar21, avatar22,
  avatar23, avatar24, avatar25, avatar26, avatar27, avatar28, avatar29,
  avatar30, avatar31, avatar32, avatar33, avatar34, avatar35, avatar36,
  avatar37, avatar38, avatar39, avatar40, avatar41, avatar42, avatar43,
  avatar44, avatar45, avatar46, avatar47, avatar48, avatar49, avatar50,
  avatar51, avatar52, avatar53, avatar54,
];

export const preloadAvatars = () => {
  const arr = [defaultAvatar, ...avatars];
  return arr.map((v) => new Promise((rs) => {
    const img = new Image();
    img.src = v;
    img.onload = rs;
  }));
};
