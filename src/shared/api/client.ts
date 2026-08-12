import axios from 'axios';
import { API_BASE } from '@/shared/config';

export const client = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
});
