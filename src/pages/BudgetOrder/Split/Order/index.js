import React, { Component } from 'react';
import { connect } from 'dva';
import cls from 'classnames';
import { get, isEqual } from 'lodash';
import PropTypes from 'prop-types';
import { Layout, Modal } from 'antd';
import { ListLoader, message } from 'suid';
import { constants } from '@/utils';
import Banner from './Banner';
import RequestHead from './Head';
import RequestItem from './Item';
import styles from './index.less';

const { REQUEST_ORDER_ACTION } = constants;
const ACTIONS = Object.keys(REQUEST_ORDER_ACTION).map(key => REQUEST_ORDER_ACTION[key]);

const { Content } = Layout;

@connect(({ splitOrder, loading }) => ({ splitOrder, loading }))
class RequestOrder extends Component {
  static requestAttachmentRef;

  static requestHeadRef;

  static needRefreshList;

  static propTypes = {
    title: PropTypes.string.isRequired,
    action: PropTypes.oneOf(ACTIONS).isRequired,
    requestId: PropTypes.string,
    onOrderRef: PropTypes.func,
    onCloseModal: PropTypes.func,
  };

  componentDidMount() {
    const { onOrderRef } = this.props;
    if (onOrderRef) {
      onOrderRef(this);
    }
    this.needRefreshList = false;
    this.getRequestHead();
  }

  componentDidUpdate(preProps) {
    const { requestId } = this.props;
    if (!isEqual(preProps.requestId, requestId)) {
      this.getRequestHead();
    }
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    this.needRefreshList = false;
    dispatch({
      type: 'splitOrder/updateState',
      payload: {
        headData: null,
        showDimensionSelection: false,
        dimensionsData: [],
        showProgressResult: false,
      },
    });
  }

  warning = msg => {
    Modal.warning({
      title: '获取单据失败',
      content: msg,
      okText: '知道了',
      onOk: () => {
        this.closeOrder();
      },
    });
  };

  getRequestHead = () => {
    const { requestId, dispatch } = this.props;
    if (requestId) {
      dispatch({
        type: 'splitOrder/getHead',
        payload: {
          id: requestId,
        },
        callback: res => {
          if (res.success === false) {
            this.warning(res.message);
          }
        },
      });
    }
  };

  handlerHeadRef = ref => {
    this.requestHeadRef = ref;
  };

  closeOrder = () => {
    const { onCloseModal } = this.props;
    if (onCloseModal) {
      onCloseModal(this.needRefreshList);
    }
  };

  effective = () => {
    const {
      dispatch,
      splitOrder: { headData },
    } = this.props;
    const orderId = get(headData, 'id');
    dispatch({
      type: 'splitOrder/effective',
      payload: {
        orderId,
      },
      callbackSuccess: () => {
        this.needRefreshList = true;
      },
    });
  };

  checkAttachment = () => {
    const { ready, fileList, errorFileCount } = this.requestAttachmentRef.getAttachmentStatus();
    let docIds = [];
    let isValidDoc = true;
    let msgText = '';
    if (ready === true && errorFileCount === 0) {
      docIds = (fileList || []).map(f => f.id);
    } else {
      isValidDoc = false;
      msgText = '附件正在上传中或上传失败！';
    }
    return { docIds, isValidDoc, msgText };
  };

  handlerAttachmentRef = ref => {
    this.requestAttachmentRef = ref;
  };

  /** 流程中保存单据的代理方法 */
  linkSaveOrder = callBack => {
    this.saveOrder(null, callBack);
  };

  saveOrder = (e, flowCallBack) => {
    if (e) {
      e.stopPropagation();
    }
    const { dispatch } = this.props;
    const { isValid, data } = this.requestHeadRef.getHeaderData();
    const { docIds, isValidDoc, msgText } = this.checkAttachment();
    if (isValid && isValidDoc) {
      dispatch({
        type: 'splitOrder/save',
        payload: {
          ...data,
          docIds,
          inFlow: !!flowCallBack,
        },
        callback: res => {
          if (flowCallBack && flowCallBack instanceof Function) {
            flowCallBack(res);
          }
          if (res.success) {
            this.needRefreshList = true;
          }
        },
      });
    } else {
      let msg = '';
      if (!isValid) {
        msg = '数据验证未通过，请检查后再试一次';
      } else if (!isValidDoc) {
        msg = msgText;
      }
      if (flowCallBack && flowCallBack instanceof Function) {
        flowCallBack({ success: false, message: msg });
      } else {
        message.destroy();
        message.error(msg);
      }
    }
  };

  handlerStartComlete = res => {
    if (res.success) {
      this.closeOrder();
    }
  };

  checkDimensionForSelect = () => {
    const { isValid, data } = this.requestHeadRef.getHeaderData();
    if (isValid) {
      const { dispatch } = this.props;
      dispatch({
        type: 'splitOrder/checkDimensionForSelect',
        payload: {
          headData: data,
        },
      });
    }
  };

  clearItem = callBack => {
    const { dispatch } = this.props;
    dispatch({
      type: 'splitOrder/clearOrderItems',
      successCallback: callBack,
    });
  };

  closeDimensionSelection = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'splitOrder/updateState',
      payload: {
        showDimensionSelection: false,
      },
    });
  };

  handlerSaveItem = (data, successCallBack) => {
    const { isValid, data: headData } = this.requestHeadRef.getHeaderData();
    const { docIds, isValidDoc } = this.checkAttachment();
    if (isValid && isValidDoc) {
      const { dispatch } = this.props;
      dispatch({
        type: 'splitOrder/addOrderDetails',
        payload: {
          ...headData,
          ...data,
          docIds,
        },
        successCallback: resultData => {
          if (successCallBack && successCallBack instanceof Function) {
            successCallBack(resultData);
          }
        },
      });
    }
  };

  removeOrderItems = (data, successCallBack) => {
    const { dispatch } = this.props;
    const { keys, sourceItem } = data;
    const childrenItems = get(sourceItem, 'children') || [];
    const dispatchProps = {
      type: 'splitOrder/removeOrderItems',
      payload: keys,
    };
    if (childrenItems.length === 0) {
      Object.assign(dispatchProps, {
        type: 'splitOrder/removeOrderEmptyItems',
        payload: { groupId: get(sourceItem, 'id') },
      });
    }
    dispatch({
      ...dispatchProps,
      successCallback: () => {
        if (successCallBack && successCallBack instanceof Function) {
          successCallBack();
        }
      },
    });
  };

  handlerItemCompleted = callBack => {
    const { dispatch } = this.props;
    dispatch({
      type: 'splitOrder/renewHead',
    });
    if (callBack && callBack instanceof Function) {
      callBack();
    }
  };

  handlerSaveItemMoney = (rowItem, amount, callBack) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'splitOrder/saveItemMoney',
      payload: {
        rowItem: { ...rowItem, amount },
      },
      callback: res => {
        if (callBack && callBack instanceof Function) {
          callBack(res);
        }
      },
    });
  };

  handlerHeadCheck = () => {
    let checkedPassed = false;
    if (this.requestHeadRef) {
      const { dispatch, splitOrder } = this.props;
      const { headData } = splitOrder;
      const { data, isValid } = this.requestHeadRef.getHeaderData();
      const { docIds, isValidDoc } = this.checkAttachment();
      if (isValid && isValidDoc) {
        const head = { ...headData, docIds };
        Object.assign(head, data);
        checkedPassed = true;
        dispatch({
          type: 'splitOrder/updateState',
          payload: { headData: head },
        });
      }
    }
    return checkedPassed;
  };

  handlerCompleteImport = orderId => {
    const { dispatch, splitOrder } = this.props;
    const { headData } = splitOrder;
    const id = get(headData, 'id') || orderId;
    const head = { ...headData, id };
    dispatch({
      type: 'splitOrder/updateState',
      payload: {
        headData: head,
        showProgressResult: true,
      },
    });
  };

  handlerDataExport = orderId => {
    const { dispatch, splitOrder } = this.props;
    const { headData } = splitOrder;
    const id = get(headData, 'id') || orderId;
    dispatch({
      type: 'splitOrder/dataExport',
      payload: {
        orderId: id,
      },
    });
  };

  render() {
    const { action, title, loading, splitOrder } = this.props;
    const {
      headData,
      dimensionsData,
      showDimensionSelection,
      showProgressResult,
      subDimensionFields,
    } = splitOrder;
    const bannerProps = {
      headData,
      title,
      actionProps: {
        action,
        tempDisabled: showDimensionSelection || showProgressResult,
        saveOrder: this.saveOrder,
        saving: loading.effects['splitOrder/save'],
        closeOrder: this.closeOrder,
        loadingGlobal: loading.global,
        handlerStartComlete: this.handlerStartComlete,
        effective: this.effective,
        effecting: loading.effects['splitOrder/effective'],
      },
    };
    const requestHeadProps = {
      tempDisabled: showDimensionSelection || showProgressResult,
      onHeadRef: this.handlerHeadRef,
      action,
      headData,
    };
    const requestItemProps = {
      action,
      headData,
      headCheck: this.handlerHeadCheck,
      checkDimensionForSelect: this.checkDimensionForSelect,
      dimensionselectChecking: loading.effects['splitOrder/checkDimensionForSelect'],
      clearItem: this.clearItem,
      clearing: loading.effects['splitOrder/clearOrderItems'],
      dimensionsData,
      subDimensionFields,
      globalDisabled: loading.global,
      showDimensionSelection,
      showProgressResult,
      onItemCompleted: this.handlerItemCompleted,
      closeDimensionSelection: this.closeDimensionSelection,
      save: this.handlerSaveItem,
      saving: loading.effects['splitOrder/addOrderDetails'],
      onSaveItemMoney: this.handlerSaveItemMoney,
      itemMoneySaving: loading.effects['splitOrder/saveItemMoney'],
      removeOrderItems: this.removeOrderItems,
      removing:
        loading.effects['splitOrder/removeOrderItems'] ||
        loading.effects['splitOrder/removeOrderEmptyItems'],
      completeImport: this.handlerCompleteImport,
      onAttachmentRef: this.handlerAttachmentRef,
      dataExport: this.handlerDataExport,
      exporting: loading.effects['splitOrder/dataExport'],
    };
    const headLoading = loading.effects['splitOrder/getHead'];
    return (
      <Layout className={cls(styles['order-box'], 'flow-order-box')}>
        <Content className="order-content-box">
          {headLoading ? (
            <ListLoader />
          ) : (
            <>
              <Banner {...bannerProps} />
              <RequestHead {...requestHeadProps} />
              <RequestItem {...requestItemProps} />
            </>
          )}
        </Content>
      </Layout>
    );
  }
}

export default RequestOrder;
