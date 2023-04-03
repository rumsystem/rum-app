import request from '../request';
import qs from 'query-string';

interface PixabayOptions {
  q?: string
  page?: number
  per_page?: number
  lang?: 'zh' | 'en'
}
export interface PixiabayRes {
  total: number
  totalHits: number
  hits: Array<PixiabayImageItem>
}

export interface PixiabayImageItem {
  id: number
  pageURL: string
  type: Type
  tags: string
  previewURL: string
  previewWidth: number
  previewHeight: number
  webformatURL: string
  webformatWidth: number
  webformatHeight: number
  largeImageURL: string
  imageWidth: number
  imageHeight: number
  imageSize: number
  views: number
  downloads: number
  collections: number
  likes: number
  comments: number
  user_id: number
  user: string
  userImageURL: string
}

export enum Type {
  Photo = 'photo',
}


export default {
  search(options: PixabayOptions = {}) {
    return request(
      `/api/?key=13927481-1de5dcccace42d9447c90346f&safesearch=true&image_type=photo&${qs.stringify(
        options,
      )}`,
      {
        base: 'https://pixabay.com',
        minPendingDuration: 300,
      },
    ) as Promise<PixiabayRes>;
  },
};
