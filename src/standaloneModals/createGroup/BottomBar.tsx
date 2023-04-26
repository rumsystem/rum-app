import React from 'react';
import { StepBox } from './StepBox';
import Button from 'components/Button';
import { lang } from 'utils/lang';

interface IProps {
  total: number
  creating: boolean
  step: number
  onChange: (step: number) => void
  handleClose: any
  handleConfirm: any
}

export default (props: IProps) => (
  <div className="flex flex-center">
    {props.step === 0 && (
      <Button
        outline
        onClick={() => {
          if (props.creating) {
            return;
          }
          props.handleClose();
        }}
        data-test-id="create-group-modal-close"
      >
        {lang.back}
      </Button>
    )}
    {props.step > 0 && (
      <Button
        outline
        onClick={() => {
          props.onChange(props.step - 1);
        }}
        data-test-id="create-group-modal-prev-step"
      >
        上一步
      </Button>
    )}
    <StepBox
      className="mx-20"
      total={props.total}
      value={props.step}
    />
    {(props.step + 1 < props.total) && (
      <Button
        onClick={() => {
          props.onChange(props.step + 1);
        }}
        data-test-id="create-group-modal-next-step"
      >
        下一步
      </Button>
    )}
    {(props.step + 1 >= props.total) && (
      <Button
        onClick={props.handleConfirm}
        isDoing={props.creating}
        data-test-id="create-group-modal-confirm"
      >
        {lang.createGroup}
      </Button>
    )}
  </div>
);
