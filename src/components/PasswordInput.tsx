import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { TextField, TextFieldProps, IconButton, InputAdornment } from '@material-ui/core';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default observer((props: TextFieldProps) => {
  const state = useLocalObservable(() => ({
    showPassword: false,
  }));

  return (
    <TextField
      {...props}
      type={state.showPassword ? 'text' : 'password'}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              className="transform scale-75 -mr-2"
              onClick={() => {
                state.showPassword = !state.showPassword;
              }}
            >
              {state.showPassword ? <MdVisibility /> : <MdVisibilityOff />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
});
