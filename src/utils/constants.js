/*
 * @Author: Eason
 * @Date: 2020-02-21 18:03:16
 * @Last Modified by: Eason
 * @Last Modified time: 2021-04-23 14:24:28
 */
import { base } from '../../public/app.config.json';

/** 服务接口基地址，默认是当前站点的域名地址 */
const BASE_DOMAIN = '/';

/** 网关地址 */
const GATEWAY = 'api-gateway';

/**
 * 非生产环境下是使用mocker开发，还是与真实后台开发或联调
 * 注：
 *    yarn start 使用真实后台开发或联调
 *    yarn start:mock 使用mocker数据模拟
 */
const getServerPath = () => {
  if (process.env.NODE_ENV !== 'production') {
    if (process.env.MOCK === 'yes') {
      return '/mocker.api';
    }
    return '/api-gateway';
  }
  return `${BASE_DOMAIN}${GATEWAY}`;
};

/** 项目的站点基地址 */
const APP_BASE = base;

/** 站点的地址，用于获取本站点的静态资源如json文件，xls数据导入模板等等 */
const LOCAL_PATH = process.env.NODE_ENV !== 'production' ? '..' : `../${APP_BASE}`;

const SERVER_PATH = getServerPath();

const LOGIN_STATUS = {
  SUCCESS: 'success',
  MULTI_TENANT: 'multiTenant',
  CAPTCHA_ERROR: 'captchaError',
  FROZEN: 'frozen',
  LOCKED: 'locked',
  FAILURE: 'failure',
};

/** 业务模块功能项示例 */
const APP_MODULE_BTN_KEY = {
  CREATE: `${APP_BASE}_CREATE`,
  EDIT: `${APP_BASE}_EDIT`,
  DELETE: `${APP_BASE}_DELETE`,
};

/** 策略类别 */
const STRATEGY_TYPE = {
  DIMENSION: { key: 'DIMENSION', title: '维度', color: '#108ee9' },
  MANAGEMENT: { key: 'MANAGEMENT', title: '管理', color: '#2db7f5' },
  EXECUTION: { key: 'EXECUTION', title: '执行', color: '#87d068' },
};

/** 预算维度组件 */
const BUDGET_DIMENSION_UI_COMPONENT = {
  SUBJECT: { code: 'Subject', name: '科目' },
  ORGANIZATION: { code: 'Organization', name: '组织机构' },
  PROJECTLIST: { code: 'ProjectList', name: '项目(列表)' },
  PERIOD: { code: 'Period', name: '期间' },
};

/** 期间类型 */
const PERIOD_TYPE = {
  ALL: { key: 'ALL', title: '全部' },
  ANNUAL: { key: 'ANNUAL', title: '年度' },
  SEMIANNUAL: { key: 'SEMIANNUAL', title: '半年度' },
  QUARTER: { key: 'QUARTER', title: '季度' },
  MONTHLY: { key: 'MONTHLY', title: '月度' },
  CUSTOMIZE: { key: 'CUSTOMIZE', title: '自定义' },
};

export default {
  APP_BASE,
  LOCAL_PATH,
  SERVER_PATH,
  APP_MODULE_BTN_KEY,
  LOGIN_STATUS,
  STRATEGY_TYPE,
  BUDGET_DIMENSION_UI_COMPONENT,
  PERIOD_TYPE,
};
