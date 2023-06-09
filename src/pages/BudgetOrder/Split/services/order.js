import { utils } from 'suid';
import { constants } from '@/utils';

const { request } = utils;

const { SERVER_PATH } = constants;

/** 保存单据 */
export async function save(data) {
  const url = `${SERVER_PATH}/bems-v6/order/saveOrder`;
  return request({
    url,
    method: 'POST',
    data,
  });
}

/** 保存行金额
 * @detailId
 * @amount
 */
export async function saveItemMoney(params) {
  const url = `${SERVER_PATH}/bems-v6/order/updateDetailAmount`;
  return request({
    url,
    method: 'POST',
    params,
    headers: { neverCancel: true },
    data: {},
  });
}

/** 删除行 */
export async function removeOrderItems(data) {
  const url = `${SERVER_PATH}/bems-v6/order/removeOrderItems`;
  return request({
    url,
    method: 'DELETE',
    data,
  });
}

/**
 * 删除来源为空的行
 * @groupId
 */
export async function removeOrderEmptyItems(params) {
  const url = `${SERVER_PATH}/bems-v6/order/removeSplitOrderItems`;
  return request({
    url,
    method: 'DELETE',
    params,
    data: {},
  });
}

/** 检查是否可以添加明细包括导入
 * @subjectId
 * @categoryId
 * @orderId
 */
export async function checkDimension(params) {
  const url = `${SERVER_PATH}/bems-v6/order/checkDimension`;
  return request({
    url,
    params,
  });
}

/** 根据预算类型Id获取预算的维度
 * @categoryId
 */
export async function getDimension(params) {
  const url = `${SERVER_PATH}/bems-v6/category/getAssigned`;
  return request({
    url,
    params,
  });
}

/**
 * 清空申请明细
 * @orderId string
 */
export async function clearOrderItems(params) {
  const url = `${SERVER_PATH}/bems-v6/order/clearOrderItems`;
  return request({
    url,
    method: 'POST',
    data: {},
    params,
  });
}

/**
 * 批量添加一个预算申请单行项明细
 */
export async function addOrderDetails(data) {
  const url = `${SERVER_PATH}/bems-v6/order/addOrderDetails`;
  return request({
    url,
    method: 'POST',
    data,
  });
}

/**
 * 获取单据抬头
 * @id
 */
export async function getHead(params) {
  const url = `${SERVER_PATH}/bems-v6/order/getHead`;
  return request({
    url,
    params,
  });
}

/**
 * 直接生效
 */
export async function effective(params) {
  const url = `${SERVER_PATH}/bems-v6/order/effectiveOrder`;
  return request({
    url,
    method: 'POST',
    params,
    data: {},
  });
}

/** 行项目数据导出 */
export async function dataExport(params) {
  const url = `${SERVER_PATH}/bems-v6/order/export`;
  return request({
    url,
    method: 'GET',
    params,
  });
}

/**
 * 获取初始的合计金额
 * @id
 */
export async function getSumAmount(params) {
  const url = `${SERVER_PATH}/bems-v6/order/getSumAmount`;
  return request({
    url,
    params,
  });
}

/**
 * 检查行项是否存储未处理或有错误的
 * @orderId
 */
export async function checkProcessed(params) {
  const url = `${SERVER_PATH}/bems-v6/order/checkProcessed`;
  return request({
    url,
    method: 'GET',
    params,
  });
}
