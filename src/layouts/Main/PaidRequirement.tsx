import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import pay from 'standaloneModals/pay';
import sleep from 'utils/sleep';

export default observer(() => {
  const state = useLocalObservable(() => ({
    loading: false,
    pending: false,
  }));

  const handlePay = async () => {
    const isSuccess = await pay({
      paymentUrl: '123',
      desc: '请支付 12 CNB 以使用该种子网络',
    });
    if (isSuccess) {
      console.log('用户支付了');
      await sleep(400);
      state.pending = true;
    } else {
      console.error('用户取消了');
    }
  };

  return (
    <div className="mt-20">
      <div className="text-gray-70 text-center text-16 leading-loose tracking-wide">
        这是一个收费的种子网络
        <br />
        请先支付 12 CNB 以开通使用
      </div>

      <Button
        className="mx-auto block mt-4"
        onClick={handlePay}
        disabled={state.pending}
      >
        {state.pending ? '已支付成功，等待创建者确认通过...' : '去支付'}
      </Button>
    </div>
  );
});
