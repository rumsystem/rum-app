import React from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'components/Button';
import { shell } from 'electron';

export default observer(() => {
  return (
    <div className="bg-white rounded-12 text-gray-6d">
      <div className="px-5 pt-4 pb-3 leading-none text-16 border-b border-gray-ec flex justify-between items-center">
        API 管理
      </div>
      <div className="py-6 px-8">
        <div>
          <div className="font-bold text-16 text-gray-700">API 密钥</div>
          <div className="mt-2 pl-5 flex items-center">
            密钥文件：
            <Button size="mini" className="ml-2-px">
              下载
            </Button>
          </div>
        </div>
        <div className="pt-6">
          <div className="font-bold text-16 text-gray-700">我的 API</div>
          <div className="pl-5">
            <div className="mt-3 flex items-center">
              从链上读取用户列表：
              <span
                className="text-indigo-400 cursor-pointer"
                onClick={() => {
                  shell.openExternal(
                    'https://prs-bp1.press.one/api/pip2001?topic=b0880dad8c8cd1e150eea1599ba7390c98136c49&count=10'
                  );
                }}
              >
                https://prs-bp1.press.one/api/pip2001?topic=b0880dad8c8cd1e150eea1599ba7390c98136c49&count=10
              </span>
            </div>
            <div className="mt-2 flex items-center">
              从链上读取文章列表：
              <span
                className="text-indigo-400 cursor-pointer"
                onClick={() => {
                  shell.openExternal(
                    'https://prs-bp1.press.one/api/pip2001?topic=b0880dad8c8cd1e150eea1599ba7390c98136c49&count=10'
                  );
                }}
              >
                https://prs-bp1.press.one/api/pip2001?topic=b0880dad8c8cd1e150eea1599ba7390c98136c49&count=10
              </span>
            </div>
          </div>
        </div>
        <div className="pt-6">
          <div className="font-bold text-16 text-gray-700">开发文档</div>
          <div className="mt-2 pl-5 flex items-center">
            查看如何使用 PRS API 开发应用：
            <Button
              size="mini"
              className="ml-2-px"
              onClick={() => {
                shell.openExternal('https://docs.prsdev.club/#/flying-pub/');
              }}
            >
              打开文档
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
