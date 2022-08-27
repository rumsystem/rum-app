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
      >
        下一步
      </Button>
    )}
    {(props.step + 1 >= props.total) && (
      <Button
        onClick={props.handleConfirm}
        isDoing={props.creating}
      >
        {lang.createGroup}
      </Button>
    )}
  </div>
);
