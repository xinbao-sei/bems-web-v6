import { formatMessage } from 'umi-plugin-react/locale';
import { utils, message } from 'suid';
import { constants } from '@/utils';
import { del, save, frozen, privateReference, assign, unassign } from './service';

const { TYPE_CLASS, MASTER_CLASSIFICATION } = constants;
const MASTER_CLASSIFICATION_DATA = Object.keys(MASTER_CLASSIFICATION)
  .map(key => MASTER_CLASSIFICATION[key])
  .filter(it => it.key !== MASTER_CLASSIFICATION.ALL.key);
const TYPE_CLASS_DATA = Object.keys(TYPE_CLASS).map(key => TYPE_CLASS[key]);
const { dvaModel } = utils;
const { modelExtend, model } = dvaModel;
const [defaultTypeClass] = TYPE_CLASS_DATA;

export default modelExtend(model, {
  namespace: 'budgetType',

  state: {
    rowData: null,
    showModal: false,
    currentMaster: null,
    selectTypeClass: defaultTypeClass,
    typeClassData: TYPE_CLASS_DATA,
    classificationData: MASTER_CLASSIFICATION_DATA,
    selectedBudgetType: null,
    showAssign: false,
  },
  effects: {
    *save({ payload, callback }, { call }) {
      const re = yield call(save, payload);
      message.destroy();
      if (re.success) {
        message.success(formatMessage({ id: 'global.save-success', defaultMessage: '保存成功' }));
      } else {
        message.error(re.message);
      }
      if (callback && callback instanceof Function) {
        callback(re);
      }
    },
    *del({ payload, callback }, { call }) {
      const re = yield call(del, payload);
      message.destroy();
      if (re.success) {
        message.success(formatMessage({ id: 'global.delete-success', defaultMessage: '删除成功' }));
      } else {
        message.error(re.message);
      }
      if (callback && callback instanceof Function) {
        callback(re);
      }
    },
    *frozen({ payload, callback }, { call }) {
      const re = yield call(frozen, payload);
      message.destroy();
      if (re.success) {
        message.success('操作成功');
      } else {
        message.error(re.message);
      }
      if (callback && callback instanceof Function) {
        callback(re);
      }
    },
    *privateReference({ payload, callback }, { call }) {
      const re = yield call(privateReference, payload);
      message.destroy();
      if (re.success) {
        message.success('操作成功');
      } else {
        message.error(re.message);
      }
      if (callback && callback instanceof Function) {
        callback(re);
      }
    },
    *assign({ payload, callback }, { call, put }) {
      const re = yield call(assign, payload);
      message.destroy();
      if (re.success) {
        yield put({
          type: 'updateState',
          payload: {
            showAssign: false,
          },
        });
        message.success('维度分配成功');
      } else {
        message.error(re.message);
      }
      if (callback && callback instanceof Function) {
        callback(re);
      }
    },
    *removeAssigned({ payload, callback }, { call }) {
      const re = yield call(unassign, payload);
      message.destroy();
      if (re.success) {
        message.success('维度移除成功');
      } else {
        message.error(re.message);
      }
      if (callback && callback instanceof Function) {
        callback(re);
      }
    },
  },
});
