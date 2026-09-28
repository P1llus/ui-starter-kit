import { create } from 'zustand';
import { timed } from '../core';
import { buildActivity, buildServices } from './data';
import type { Activity, Service } from './types';

interface SampleState {
  services: Service[];
  /** Newest first. */
  activity: Activity[];
}

function build(): SampleState {
  const services = buildServices();
  return { services, activity: buildActivity(services) };
}

/** Built once at module load, so a reload resets it. No persistence. */
export const useSampleStore = create<SampleState>()(() => timed('sample', build));
