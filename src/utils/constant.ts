/** 群组模板类型(用于[group.app_key]) */
export enum GROUP_TEMPLATE_TYPE {
  TIMELINE = 'group_timeline',
  POST = 'group_post',
  NOTE = 'group_note',
}

/** 群组 config */
export enum GROUP_CONFIG_KEY {
  GROUP_ICON = 'group_icon',
  GROUP_DESC = 'group_desc',
  GROUP_ANNOUNCEMENT = 'group_announcement',
  GROUP_DEFAULT_PERMISSION = 'group_default_permission',
}

export enum GROUP_DEFAULT_PERMISSION {
  READ = 'READ',
  WRITE = 'WRITE',
}


export const BOOTSTRAPS = [
  '/ip4/94.23.17.189/tcp/10666/p2p/16Uiu2HAmGTcDnhj3KVQUwVx8SGLyKBXQwfAxNayJdEwfsnUYKK4u',
  '/ip4/132.145.109.63/tcp/10666/p2p/16Uiu2HAmTovb8kAJiYK8saskzz7cRQhb45NRK5AsbtdmYsLfD3RM',
];

export const wsBootstraps = [
  '/ip4/139.155.182.182/tcp/33333/ws/p2p/16Uiu2HAmBUxzcXjCydQTcKgpXvmBZc3paQdTT5j8RXp23M7avi1z',
  '/ip4/94.23.17.189/tcp/10667/ws/p2p/16Uiu2HAmGTcDnhj3KVQUwVx8SGLyKBXQwfAxNayJdEwfsnUYKK4u',
];

export const DEV_NETWORK_BOOTSTRAPS = [
  '/ip4/188.165.246.97/tcp/10222/p2p/16Uiu2HAmKoTHcNndoMCqSsUEuq51DJqeKDh5p5gQyHg5bGA5fmtd',
];

export const OBJECT_STATUS_DELETED_LABEL = 'OBJECT_STATUS_DELETED';

export const MIXIN_BOT_CONFIG = {
  client_id: 'c6edac2d-e66c-474c-b98b-7797876751f2',
  session_id: 'cec3f65f-22b9-43d9-ad06-82b090a5a0c1',
  pin_token: 'PqIXIsIYkmDaaPp0Ao/7ZzDc2ngKzLqfZ5fhFGiHgvKEe+MoPPjDkKjI0wHXoE+29jXyz9M9/ljKoOwR9El1+fglPy/3CASZIDkCA/rQxnpg4UYyVxXzkknZoIBd3zg9hsXJKEWXFiwZ8TERFn6wrM8FE9YGL2WAU1FuNtoO92k=',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\r\nMIICXwIBAAKBgQDH95zItZnq7/VQVn5F6ffl0Qj/aEVxcyJH9YXD3VBKNlYncgvL\r\nU1ANo1994f4ThjVOwgfz3TiNilXGuUCuMBlUJe10R+shjt6M8zFkvd6XNS249Tnd\r\nhX+fEVaF5D8cK5+EwNtGc89XxZo+kGcHI2lIXFZ7aLdyMPO3pddRvWwsLQIDAQAB\r\nAoGBAIgRmtMMl77BJ8lSAbyrN29fbWL2XgKT2KjkjfA4gXDuRnOy7AmgGGIfYFQ1\r\nWoGImm+MIoMzbk8J6dI+rp+YxTJEBGbGWfS2xyWEa3thZ/8SA9qYoWAFmrkLE1zz\r\nmtKZ1LPyndislEfrMnOEDCkASWSEi210cP2HGX+NoYmlIj5VAkEA7j/HbAa0J2fy\r\na1S9ximSohaNYx4kKXhb2z28F55G1IwFmWh4vid3e/a4KXQweUZkNgQ+f4jefcBH\r\ntehnyZao0wJBANbdqt5PhFs+EafKd6A6+gjr6tfcp5NLTTZnjGvoLnhP7cRZtzW9\r\nQEdIc+ixVTIAX9d+BWl1MoplnJeeu+Xctv8CQQCEAaKlIDHBg7616YYcvfwZAxXj\r\nzVeMArwihdop2/Cy48JWdaQw9/0kGld/4HjbOT1dEIzwbQ2Z72fMSrD26RsxAkEA\r\nhBYA1GlNlEmz0NJGd9nJm3JsDAc5fPLtpGRDjpJM/ukj4XDFj+OngCqqFoHtPa+9\r\nO1vdN9c0GqAcg5ixKb1lQQJBAKviUUMIzICxJlKtDXDWebQ6Nc30smpLDnUh51ve\r\nJvKuFqBK+c9WRS48ApT1wYGoHY2BPHYijr3c7f1u1+vw0+Q=\r\n-----END RSA PRIVATE KEY-----\r\n',
  pin: '483339',
  client_secret: 'b751fd9013c3fbbe1d7341c57469faa5279288b5b35315c4453340e7f213800b',
};
