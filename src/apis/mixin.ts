import request from '../request';

export const getAccessToken = (params: {
  client_id: string
  code: string
  code_verifier: string
}) =>
  request('https://mixin-api.zeromesh.net/oauth/token', {
    method: 'POST',
    body: params,
  });

export const getUserProfile = (accessToken: string) =>
  request('https://mixin-api.zeromesh.net/me', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

export const getPaymentStatus = (params: {
  amount: string
  asset_id: string
  counter_user_id: string
  trace_id: string
}) =>
  request('https://mixin-api.zeromesh.net/payments', {
    method: 'POST',
    body: params,
  });
