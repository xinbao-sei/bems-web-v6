import React, { Component, Suspense } from 'react';
import { connect } from 'dva';
import { get, isEmpty, isNumber, isEqual } from 'lodash';
import cls from 'classnames';
import { FormattedMessage } from 'umi-plugin-react/locale';
import {
  Input,
  Descriptions,
  Tag,
  Modal,
  Layout,
  Button,
  Avatar,
  Tooltip,
  Progress,
  Divider,
} from 'antd';
import { ListCard, ExtIcon, Money, Space, PageLoader } from 'suid';
import { PeriodType } from '@/components';
import { constants } from '@/utils';
import noUse from '@/assets/no_use.svg';
import Filter from './components/Filter';
import MasterView from './components/MasterView';
import styles from './index.less';

const LogDetail = React.lazy(() => import('./LogDetail'));
const { SERVER_PATH } = constants;
const { Search } = Input;
const { Sider, Content } = Layout;
const filterFields = {
  subjectId: { fieldName: 'subjectId', operation: 'EQ', form: false },
  periodType: { fieldName: 'periodType', operation: 'EQ', form: true },
  startDate: { fieldName: 'startDate', operation: 'LE', fieldType: 'date', form: true },
  endDate: { fieldName: 'endDate', operation: 'GE', fieldType: 'date', form: true },
};

@connect(({ budgetPool, loading }) => ({ budgetPool, loading }))
class BudgetPool extends Component {
  static listCardRef;

  static total;

  static confirmModal;

  constructor() {
    super();
    this.total = 0;
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        recordItem: null,
        showFilter: false,
        filterData: {},
        showLog: false,
      },
    });
  }

  reloadData = () => {
    if (this.listCardRef) {
      this.listCardRef.remoteDataRefresh();
    }
  };

  closeLog = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        recordItem: null,
        showLog: false,
      },
    });
  };

  showLogDetail = recordItem => {
    const { dispatch } = this.props;
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        recordItem,
        showLog: true,
      },
    });
  };

  handlerSelectPool = (_, items) => {
    const {
      budgetPool: { showLog },
    } = this.props;
    if (showLog) {
      const [recordItem] = items;
      this.showLogDetail(recordItem);
    }
  };

  handlerMasterSelect = master => {
    const { dispatch, budgetPool } = this.props;
    const { filterData: originFilterData } = budgetPool;
    const filterData = { ...originFilterData, subjectId: get(master, 'id') };
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        filterData,
      },
    });
  };

  handlerFilterSubmit = filterData => {
    const { dispatch, budgetPool } = this.props;
    const { filterData: originFilterData } = budgetPool;
    if (isEqual(filterData, originFilterData)) {
      this.reloadData();
    }
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        showFilter: false,
        filterData,
      },
    });
  };

  clearFilter = e => {
    e.stopPropagation();
    const { dispatch, budgetPool } = this.props;
    const {
      filterData: { subjectId },
    } = budgetPool;
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        filterData: { subjectId },
      },
    });
  };

  handlerShowFilter = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        showFilter: true,
      },
    });
  };

  handlerCloseFilter = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        showFilter: false,
      },
    });
  };

  handlerFitlerDate = currentViewDate => {
    const { dispatch } = this.props;
    dispatch({
      type: 'budgetPool/updateState',
      payload: {
        currentViewDate,
      },
    });
  };

  itemEnableConfirm = (item, e) => {
    e.stopPropagation();
    const { dispatch } = this.props;
    const rowId = get(item, 'id');
    const poolCode = get(item, 'code');
    this.confirmModal = Modal.confirm({
      title: `启用确认`,
      content: `确定要启用池号为 ${poolCode} 的预算吗？`,
      okButtonProps: { type: 'primary' },
      style: { top: '20%' },
      okText: '确定',
      onOk: () => {
        return new Promise(resolve => {
          this.confirmModal.update({
            okButtonProps: { type: 'primary', loading: true },
            cancelButtonProps: { disabled: true },
          });
          dispatch({
            type: 'budgetPool/poolItemEnable',
            payload: [rowId],
            callback: res => {
              if (res.success) {
                resolve();
                this.reloadData();
              } else {
                this.confirmModal.update({
                  okButtonProps: { loading: false },
                  cancelButtonProps: { disabled: false },
                });
              }
            },
          });
        });
      },
      cancelText: '取消',
      onCancel: () => {
        this.confirmModal.destroy();
        this.confirmModal = null;
      },
    });
  };

  itemDiableConfirm = (item, e) => {
    e.stopPropagation();
    const { dispatch } = this.props;
    const rowId = get(item, 'id');
    const poolCode = get(item, 'code');
    this.confirmModal = Modal.confirm({
      title: `停用确认`,
      content: `确定要停用池号为 ${poolCode} 的预算吗？`,
      okButtonProps: { type: 'primary' },
      style: { top: '20%' },
      okText: '确定',
      onOk: () => {
        return new Promise(resolve => {
          this.confirmModal.update({
            okButtonProps: { type: 'primary', loading: true },
            cancelButtonProps: { disabled: true },
          });
          dispatch({
            type: 'budgetPool/poolItemDisable',
            payload: [rowId],
            callback: res => {
              if (res.success) {
                resolve();
                this.reloadData();
              } else {
                this.confirmModal.update({
                  okButtonProps: { loading: false },
                  cancelButtonProps: { disabled: false },
                });
              }
            },
          });
        });
      },
      cancelText: '取消',
      onCancel: () => {
        this.confirmModal.destroy();
        this.confirmModal = null;
      },
    });
  };

  trundleConfirm = (item, e) => {
    e.stopPropagation();
    const { dispatch } = this.props;
    const id = get(item, 'id');
    const poolCode = get(item, 'code');
    this.confirmModal = Modal.confirm({
      title: `滚动结转确认`,
      content: `确定要滚动结转池号为 ${poolCode} 的预算吗？`,
      okButtonProps: { type: 'primary' },
      style: { top: '20%' },
      okText: '确定',
      onOk: () => {
        return new Promise(resolve => {
          this.confirmModal.update({
            okButtonProps: { type: 'primary', loading: true },
            cancelButtonProps: { disabled: true },
          });
          dispatch({
            type: 'budgetPool/trundle',
            payload: { id },
            callback: res => {
              if (res.success) {
                resolve();
                this.reloadData();
              } else {
                this.confirmModal.update({
                  okButtonProps: { loading: false },
                  cancelButtonProps: { disabled: false },
                });
              }
            },
          });
        });
      },
      cancelText: '取消',
      onCancel: () => {
        this.confirmModal.destroy();
        this.confirmModal = null;
      },
    });
  };

  getFilters = () => {
    const { budgetPool } = this.props;
    const { filterData } = budgetPool;
    let hasFilter = false;
    const filters = [];
    Object.keys(filterData).forEach(key => {
      const filterField = get(filterFields, key);
      if (filterField) {
        const value = get(filterData, key, null);
        const form = get(filterField, 'form');
        if (!isEmpty(value) || isNumber(value)) {
          if (form) {
            hasFilter = true;
          }
          const fit = { fieldName: key, operator: get(filterField, 'operation'), value };
          const fieldType = get(filterField, 'fieldType');
          if (fieldType) {
            Object.assign(fit, { fieldType });
          }
          filters.push(fit);
        }
      }
    });
    return { filters, hasFilter };
  };

  handlerSearchChange = v => {
    this.listCardRef.handlerSearchChange(v);
  };

  handlerPressEnter = () => {
    this.listCardRef.handlerPressEnter();
  };

  handlerSearch = v => {
    this.listCardRef.handlerSearch(v);
  };

  renderCustomTool = (total, hasFilter) => {
    this.total = total;
    return (
      <>
        <div>
          <MasterView onChange={this.handlerMasterSelect} />
        </div>
        <Space>
          <Search
            allowClear
            placeholder="输入池号、维度关键字"
            onChange={e => this.handlerSearchChange(e.target.value)}
            onSearch={this.handlerSearch}
            onPressEnter={this.handlerPressEnter}
            style={{ width: 220 }}
          />
          <span
            className={cls('filter-btn', { 'has-filter': hasFilter })}
            onClick={this.handlerShowFilter}
          >
            <ExtIcon type="filter" style={{ fontSize: 16 }} />
            <span className="lable">
              <FormattedMessage id="global.filter" defaultMessage="过滤" />
            </span>
            {hasFilter ? (
              <ExtIcon
                type="close"
                className="btn-clear"
                antd
                onClick={e => this.clearFilter(e)}
                tooltip={{ title: '清除过滤条件', placement: 'bottomRight' }}
                style={{ fontSize: 14 }}
              />
            ) : null}
          </span>
        </Space>
      </>
    );
  };

  renderSubField = item => {
    const actived = get(item, 'actived');
    const subFields = this.getDisplaySubDimensionFields(item);
    if (subFields.length > 0) {
      return (
        <Descriptions
          className={cls({ disabled: !actived })}
          key={`sub${item.id}`}
          column={1}
          bordered={false}
        >
          {subFields.map(f => {
            return (
              <Descriptions.Item key={`sub${item.id}${f.dimension}`} label={f.title}>
                {get(item, f.value) || '-'}
              </Descriptions.Item>
            );
          })}
        </Descriptions>
      );
    }
    return null;
  };

  renderDescription = item => {
    const balance = get(item, 'balance');
    const currency = get(item, 'currencyCode');
    const startDate = get(item, 'startDate');
    const endDate = get(item, 'endDate');
    const actived = get(item, 'actived');
    return (
      <>
        {!actived ? (
          <embed src={noUse} style={{ position: 'absolute' }} type="image/svg+xml" />
        ) : null}
        {this.renderSubField(item)}
        <div className="money-box">
          <div className={cls('field-item', { disabled: !actived })}>
            <span className="label">预算余额</span>
            <span>
              <Money
                prefix={currency}
                className={balance < 0 ? 'red' : ''}
                value={get(item, 'balance')}
              />
              <span style={{ marginLeft: 8 }}>
                {item.strategyName ? <Tag color="purple">{item.strategyName}</Tag> : null}
                {item.roll ? <Tag color="magenta">可结转</Tag> : null}
                {item.use ? <Tag color="cyan">业务可用</Tag> : null}
              </span>
            </span>
          </div>
        </div>
        <div className={cls('field-item', { disabled: !actived })}>
          <span className="label">有效期</span>
          <span>{`${startDate} ~ ${endDate}`}</span>
        </div>
      </>
    );
  };

  renderMasterTitle = item => {
    const poolCode = get(item, 'code');
    const actived = get(item, 'actived');
    return (
      <>
        <div className={cls('pool-box', { disabled: !actived })}>
          <span className="title">池号</span>
          <span className="no">{poolCode}</span>
        </div>
        <div
          className={cls('master-title', { disabled: !actived })}
        >{`${item.periodName} ${item.itemName}(${item.item})`}</div>
      </>
    );
  };

  getDisplaySubDimensionFields = item => {
    const {
      budgetPool: { subDimensionFields },
    } = this.props;
    const fields = [];
    subDimensionFields.forEach(f => {
      if (get(item, f.dimension) !== 'none') {
        fields.push(f);
      }
    });
    return fields;
  };

  renderActivedBtn = item => {
    const actived = get(item, 'actived');
    if (actived) {
      return (
        <Button type="danger" size="small" onClick={e => this.itemDiableConfirm(item, e)}>
          停用{' '}
        </Button>
      );
    }
    return (
      <Button type="primary" ghost size="small" onClick={e => this.itemEnableConfirm(item, e)}>
        启用{' '}
      </Button>
    );
  };

  renderAction = item => {
    const roll = get(item, 'roll') || false;
    const { totalAmount, usedAmount, balance } = item;
    let percent = 0;
    if (totalAmount > 0) {
      percent = (usedAmount / totalAmount) * 100;
    }
    let status = 'active';
    if (percent >= 80) {
      status = 'exception';
    }
    return (
      <Space size={40}>
        <Space direction="vertical" size={0}>
          <Progress
            style={{ width: 420 }}
            showInfo={false}
            status={status}
            strokeLinecap="square"
            percent={percent}
            size="small"
          />
          <Space split={<Divider type="vertical" />}>
            <Money
              style={{ color: '#666', fontStyle: 'normal', fontWeight: 'normal' }}
              prefix="总额"
              value={totalAmount}
            />
            <Money
              style={{ color: '#fa8c16', fontStyle: 'normal', fontWeight: 'normal' }}
              prefix="已使用"
              value={usedAmount}
            />
            <Money
              style={{ color: '#52c41a', fontStyle: 'normal', fontWeight: 'normal' }}
              prefix="余额"
              value={balance}
            />
          </Space>
        </Space>
        <Space direction="vertical" style={{ width: 200 }} align="end">
          <Space>
            {roll ? (
              <Button size="small" onClick={e => this.trundleConfirm(item, e)}>
                滚动结转{' '}
              </Button>
            ) : null}
            {this.renderActivedBtn(item)}
            <Button size="small" onClick={() => this.showLogDetail(item)}>
              日志{' '}
            </Button>
          </Space>
        </Space>
      </Space>
    );
  };

  renderAvatar = ({ item }) => {
    return (
      <Tooltip title="预算期间类型" placement="bottomRight">
        <Avatar style={{ verticalAlign: 'middle', backgroundColor: '#aaa' }}>
          <PeriodType periodTypeKey={item.periodType} />
        </Avatar>
      </Tooltip>
    );
  };

  render() {
    const { budgetPool } = this.props;
    const { showFilter, filterData, recordItem, showLog } = budgetPool;
    const filterProps = {
      showFilter,
      filterData,
      onFilterSubmit: this.handlerFilterSubmit,
      onCloseFilter: this.handlerCloseFilter,
      showLog,
    };
    const { filters, hasFilter } = this.getFilters();
    const listProps = {
      simplePagination: false,
      showArrow: false,
      showSearch: false,
      rowCheck: false,
      pagination: {
        pageSize: 50,
        pageSizeOptions: ['50', '100', '200', '500'],
      },
      className: styles['pool-item-box'],
      onListCardRef: ref => (this.listCardRef = ref),
      customTool: ({ total }) => this.renderCustomTool(total, hasFilter),
      onSelectChange: this.handlerSelectPool,
      searchProperties: [
        'code',
        'item',
        'itemName',
        'periodName',
        'projectName',
        'orgName',
        'udf1Name',
        'udf2Name',
        'udf3Name',
        'udf4Name',
        'udf5Name',
      ],
      itemField: {
        avatar: this.renderAvatar,
        title: this.renderMasterTitle,
        description: this.renderDescription,
        extra: this.renderAction,
      },
    };
    const subjectId = get(filterData, 'subjectId');
    if (subjectId) {
      Object.assign(listProps, {
        remotePaging: true,
        cascadeParams: {
          sortOrders: [
            { property: 'itemName', direction: 'ASC' },
            { property: 'startDate', direction: 'ASC' },
          ],
          filters,
        },
        store: {
          type: 'POST',
          url: `${SERVER_PATH}/bems-v6/pool/findByPage`,
          loaded: () => {
            this.forceUpdate();
          },
        },
      });
    }
    const logDetailProps = {
      poolItem: recordItem,
      handlerClose: this.closeLog,
    };
    return (
      <div className={cls(styles['container-box'])}>
        <Layout className="auto-height">
          <Content
            className={cls('main-content', 'auto-height')}
            style={{ paddingRight: showLog ? 8 : 0 }}
          >
            <ListCard {...listProps} />
            <Filter {...filterProps} />
            <span className="page-summary">{`共 ${this.total} 项`}</span>
          </Content>
          <Sider width={showLog ? 480 : 0} className="auto-height" theme="light">
            <Suspense fallback={<PageLoader />}>
              <LogDetail {...logDetailProps} />
            </Suspense>
          </Sider>
        </Layout>
      </div>
    );
  }
}

export default BudgetPool;
