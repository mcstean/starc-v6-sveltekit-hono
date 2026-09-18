import * as migration_20260918_090037 from './20260918_090037';
import * as migration_20260918_120445_complete_lms from './20260918_120445_complete_lms';

export const migrations = [
  {
    up: migration_20260918_090037.up,
    down: migration_20260918_090037.down,
    name: '20260918_090037',
  },
  {
    up: migration_20260918_120445_complete_lms.up,
    down: migration_20260918_120445_complete_lms.down,
    name: '20260918_120445_complete_lms'
  },
];
