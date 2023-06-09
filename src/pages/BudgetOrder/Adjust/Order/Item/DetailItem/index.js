import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { get, isEqual } from 'lodash';
import { Decimal } from 'decimal.js';
import { Descriptions, Input, Button, Popconfirm, Checkbox, Alert, Tag } from 'antd';
import { ExtIcon, ListCard, Money, Space } from 'suid';
import { FilterView } from '@/components';
import { constants } from '@/utils';
import BudgetMoney from '../../../../components/BudgetMoney';
import styles from './index.less';

const { SERVER_PATH, REQUEST_ORDER_ACTION, REQUEST_ITEM_STATUS, REQUEST_VIEW_STATUS } = constants;
const ACTIONS = Object.keys(REQUEST_ORDER_ACTION).map(key => REQUEST_ORDER_ACTION[key]);
const REQUEST_ITEM_STATUS_DATA = Object.keys(REQUEST_ITEM_STATUS).map(
  key => REQUEST_ITEM_STATUS[key],
);
const { Search } = Input;

class DetailItem extends PureComponent {
  static listCardRef;

  static pagingData;

  static updownAmount;

  static propTypes = {
    onDetailItemRef: PropTypes.func,
    action: PropTypes.oneOf(ACTIONS).isRequired,
    headData: PropTypes.object,
    onSaveItemMoney: PropTypes.func,
    itemMoneySaving: PropTypes.bool,
    tempDisabled: PropTypes.bool,
    onRemoveItem: PropTypes.func,
    removing: PropTypes.bool,
    subDimensionFields: PropTypes.array,
    createPool: PropTypes.func,
    creatingPool: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    const [itemStatus] = REQUEST_ITEM_STATUS_DATA;
    this.pagingData = {};
    this.initUpdownAmount();
    this.state = {
      selectedKeys: [],
      globalDisabled: false,
      itemStatus,
      dealId: null,
    };
  }

  componentDidMount() {
    const { onDetailItemRef } = this.props;
    if (onDetailItemRef) {
      onDetailItemRef(this);
    }
    this.initGlobalAction();
    this.initUpdownAmount();
  }

  componentDidUpdate(preProps) {
    const { headData } = this.props;
    const status = get(headData, 'status');
    if (status && !isEqual(preProps.headData, headData)) {
      let globalDisabled = true;
      if (status === REQUEST_VIEW_STATUS.PREFAB.key || status === REQUEST_VIEW_STATUS.DRAFT.key) {
        globalDisabled = false;
      }
      this.initUpdownAmount();
      this.setState({ globalDisabled });
    }
  }

  componentWillUnmount() {
    this.pagingData = {};
    this.updownAmount = { up: 0, down: 0 };
  }

  initUpdownAmount = () => {
    const { headData } = this.props;
    if (headData) {
      const { updownAmount } = headData;
      this.updownAmount = {
        up: get(updownAmount, 'up') || 0,
        down: get(updownAmount, 'down') || 0,
      };
    } else {
      this.updownAmount = { up: 0, down: 0 };
    }
  };

  initGlobalAction = () => {
    const { action, tempDisabled } = this.props;
    let globalDisabled = tempDisabled || false;
    switch (action) {
      case REQUEST_ORDER_ACTION.VIEW:
      case REQUEST_ORDER_ACTION.VIEW_APPROVE_FLOW:
      case REQUEST_ORDER_ACTION.LINK_VIEW:
        globalDisabled = true;
        break;
      default:
    }
    this.setState({ globalDisabled });
  };

  reloadData = () => {
    if (this.listCardRef) {
      this.listCardRef.remoteDataRefresh();
    }
  };

  handlerSaveMoney = (rowItem, amount, callBack) => {
    const { onSaveItemMoney } = this.props;
    if (onSaveItemMoney && onSaveItemMoney instanceof Function) {
      onSaveItemMoney(rowItem, amount, res => {
        callBack();
        if (res.success) {
          const rowKey = get(rowItem, 'id');
          this.pagingData[rowKey] = res.data;
        }
      });
    }
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

  onCancelBatchRemove = () => {
    this.setState({
      selectedKeys: [],
    });
  };

  handlerRemoveItem = () => {
    const { selectedKeys } = this.state;
    const { onRemoveItem } = this.props;
    if (onRemoveItem && onRemoveItem instanceof Function) {
      onRemoveItem(selectedKeys, () => {
        selectedKeys.forEach(rowKey => {
          delete this.pagingData[rowKey];
        });
        this.setState({ selectedKeys: [] }, this.reloadData);
      });
    }
  };

  handerSelectChange = selectedKeys => {
    this.setState({ selectedKeys });
  };

  handlerItemStatusChange = itemStatus => {
    this.setState({ itemStatus });
  };

  handlerSelectAll = e => {
    if (e.target.checked) {
      this.setState({ selectedKeys: Object.keys(this.pagingData) });
    } else {
      this.setState({ selectedKeys: [] });
    }
  };

  renderCustomTool = ({ total }) => {
    const { removing } = this.props;
    const { selectedKeys, globalDisabled, itemStatus } = this.state;
    const hasSelected = selectedKeys.length > 0;
    const currentViewType = { ...itemStatus, title: `${get(itemStatus, 'title')}(${total}项)` };
    const pagingKeys = Object.keys(this.pagingData);
    const indeterminate = selectedKeys.length > 0 && selectedKeys.length < pagingKeys.length;
    const checked = selectedKeys.length > 0 && selectedKeys.length === pagingKeys.length;
    return (
      <>
        <div>
          <Space>
            {!globalDisabled ? (
              <>
                <Checkbox
                  disabled={pagingKeys.length === 0}
                  checked={checked}
                  indeterminate={indeterminate}
                  onChange={this.handlerSelectAll}
                >
                  全选
                </Checkbox>
                {hasSelected ? (
                  <>
                    <Button onClick={this.onCancelBatchRemove} disabled={removing}>
                      取消
                    </Button>
                    <Popconfirm
                      disabled={removing}
                      title="确定要删除吗？提示：删除后不能恢复"
                      onConfirm={this.handlerRemoveItem}
                    >
                      <Button type="danger" loading={removing}>
                        {`删除(${selectedKeys.length})`}
                      </Button>
                    </Popconfirm>
                  </>
                ) : null}
              </>
            ) : null}
          </Space>
        </div>
        <Space>
          <FilterView
            iconType={null}
            title="明细状态"
            showColor
            currentViewType={currentViewType}
            viewTypeData={REQUEST_ITEM_STATUS_DATA}
            onAction={this.handlerItemStatusChange}
            reader={{
              title: 'title',
              value: 'key',
            }}
          />
          <Search
            allowClear
            placeholder="输入维度关键字"
            onChange={e => this.handlerSearchChange(e.target.value)}
            onSearch={this.handlerSearch}
            onPressEnter={this.handlerPressEnter}
            style={{ width: 260 }}
          />
        </Space>
      </>
    );
  };

  handlerCreatePool = item => {
    const { createPool } = this.props;
    if (createPool && createPool instanceof Function) {
      const detailId = get(item, 'id');
      this.setState({ dealId: detailId });
      createPool(detailId, res => {
        const rowKey = get(item, 'id');
        this.pagingData[rowKey] = res.data;
        this.setState({ dealId: null });
      });
    }
  };

  renderMasterTitle = item => {
    const { dealId } = this.state;
    const rowKey = get(item, 'id');
    const poolCode = get(item, 'poolCode') || get(this.pagingData[rowKey], 'poolCode');
    const { creatingPool } = this.props;
    const creating = dealId === rowKey && creatingPool;
    return (
      <>
        <div className="pool-box">
          <span className="title">池号</span>
          <span className="no">
            {poolCode || (
              <Popconfirm
                disabled={creating}
                title="确定要创建预算池?"
                onConfirm={() => this.handlerCreatePool(item)}
              >
                <Button loading={creating} type="link" size="small">
                  创建预算池
                </Button>
              </Popconfirm>
            )}
          </span>
        </div>
        <div className="master-title">{`${item.periodName} ${item.itemName}(${item.item})`}</div>
      </>
    );
  };

  getDisplaySubDimensionFields = item => {
    const { subDimensionFields } = this.props;
    const fields = [];
    subDimensionFields.forEach(f => {
      if (get(item, f.dimension) !== 'none') {
        fields.push(f);
      }
    });
    return fields;
  };

  getFilters = () => {
    const { itemStatus } = this.state;
    const filters = [];
    if (itemStatus.key === REQUEST_ITEM_STATUS.NORMAL.key) {
      filters.push({ fieldName: 'hasErr', operator: 'EQ', value: false });
    }
    if (itemStatus.key === REQUEST_ITEM_STATUS.ERROR.key) {
      filters.push({ fieldName: 'hasErr', operator: 'EQ', value: true });
    }
    return { filters };
  };

  renderSubField = item => {
    const subFields = this.getDisplaySubDimensionFields(item);
    if (subFields.length > 0) {
      return (
        <Descriptions key={`sub${item.id}`} column={2} bordered={false}>
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
    const { globalDisabled } = this.state;
    const { itemMoneySaving } = this.props;
    const rowKey = get(item, 'id');
    const amount =
      get(this.pagingData[rowKey], 'amount') !== undefined
        ? get(this.pagingData[rowKey], 'amount')
        : get(item, 'amount');
    const errMsg = get(this.pagingData[rowKey], 'errMsg') || '';
    const poolAmount = get(item, 'poolAmount');
    const afterAmount = new Decimal(poolAmount).add(new Decimal(amount));
    const poolCode = get(item, 'poolCode') || get(this.pagingData[rowKey], 'poolCode');
    return (
      <>
        {this.renderSubField(item)}
        <div className="money-box">
          <div className="field-item">
            <span className="label">调整前余额</span>
            <span>
              <Money value={poolAmount} />
            </span>
          </div>
          <BudgetMoney
            className="inject-money"
            amount={amount}
            title="调整金额"
            rowItem={item}
            loading={itemMoneySaving}
            allowEdit={!globalDisabled && !!poolCode}
            onSave={this.handlerSaveMoney}
          />
          <div className="field-item">
            <span className="label">调整后余额</span>
            <span>
              <Money value={afterAmount} />
            </span>
          </div>
          {errMsg ? <Alert type="error" message={errMsg} banner closable /> : null}
        </div>
      </>
    );
  };

  render() {
    const { selectedKeys, globalDisabled } = this.state;
    const { headData, tempDisabled } = this.props;
    const orderId = get(headData, 'id');
    const listProps = {
      simplePagination: false,
      showArrow: false,
      showSearch: false,
      checkbox: !globalDisabled,
      rowCheck: false,
      pagination: {
        pageSize: 50,
        pageSizeOptions: ['50', '100', '200', '500'],
      },
      checkboxProps: () => {
        return { tabIndex: -1 };
      },
      selectedKeys,
      onListCardRef: ref => (this.listCardRef = ref),
      customTool: this.renderCustomTool,
      searchProperties: [
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
        title: this.renderMasterTitle,
        description: this.renderDescription,
      },
      onSelectChange: this.handerSelectChange,
    };
    if (orderId && tempDisabled === false) {
      const filters = this.getFilters();
      Object.assign(listProps, {
        remotePaging: true,
        store: {
          type: 'POST',
          url: `${SERVER_PATH}/bems-v6/order/getOrderItems/${orderId}`,
          loaded: res => {
            const data = get(res, 'data.rows') || [];
            data.forEach(d => {
              this.pagingData[d.id] = d;
            });
          },
        },
        cascadeParams: {
          sortOrders: [
            { property: 'period', direction: 'ASC' },
            { property: 'itemName', direction: 'ASC' },
          ],
          ...filters,
        },
      });
    }
    return (
      <div className={styles['detail-item-box']}>
        <ListCard {...listProps} />
        <div className="detail-summary">
          <Tag color="green" style={{ borderColor: 'transparent', backgroundColor: 'transparent' }}>
            <Money
              prefix={
                <>
                  <ExtIcon type="arrow-up" antd />
                  调增
                </>
              }
              style={{ color: '#52c41a', fontWeight: 700 }}
              value={this.updownAmount.up}
            />
          </Tag>
          <Tag color="red" style={{ borderColor: 'transparent', backgroundColor: 'transparent' }}>
            <Money
              prefix={
                <>
                  <ExtIcon type="arrow-down" antd />
                  调减
                </>
              }
              style={{ color: '#f5222d', fontWeight: 700 }}
              value={this.updownAmount.down}
            />
          </Tag>
        </div>
      </div>
    );
  }
}

export default DetailItem;
