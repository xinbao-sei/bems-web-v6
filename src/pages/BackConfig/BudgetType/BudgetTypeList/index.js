import React, { Component } from 'react';
import { connect } from 'dva';
import { get } from 'lodash';
import cls from 'classnames';
import { formatMessage } from 'umi-plugin-react/locale';
import { Input, Empty, Popconfirm, Layout, Tag, Avatar } from 'antd';
import { ExtIcon, ListCard, Space } from 'suid';
import empty from '@/assets/item_empty.svg';
import { constants } from '@/utils';
import BudgetAdd from '../components/BudgetTypeForm/Add';
import BudgetEdit from '../components/BudgetTypeForm/Edit';
import AssignedDimension from '../AssignedDimension';
import styles from './index.less';

const { SERVER_PATH, TYPE_CLASS, PERIOD_TYPE, ORDER_CATEGORY, MASTER_CLASSIFICATION } = constants;
const { Search } = Input;
const { Sider, Content } = Layout;

@connect(({ budgetType, loading }) => ({ budgetType, loading }))
class BudgetTypeList extends Component {
  static listCardRef = null;

  static assignedRef;

  constructor(props) {
    super(props);
    this.state = {
      dealId: null,
    };
  }

  componentDidMount() {
    const { onRef } = this.props;
    if (onRef) {
      onRef(this);
    }
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'budgetType/updateState',
      payload: {
        showAssign: false,
      },
    });
  }

  handlerAssignedRef = ref => {
    this.assignedRef = ref;
  };

  reloadData = () => {
    if (this.listCardRef) {
      this.listCardRef.remoteDataRefresh();
    }
  };

  reloadAssignedList = () => {
    if (this.assignedRef) {
      this.assignedRef.reloadData();
    }
  };

  save = (data, handlerPopoverHide) => {
    const { dispatch, budgetType } = this.props;
    const { currentMaster, selectTypeClass } = budgetType;
    dispatch({
      type: 'budgetType/save',
      payload: {
        subjectId: get(currentMaster, 'id'),
        subjectName: get(currentMaster, 'name'),
        type: selectTypeClass.key,
        ...data,
      },
      callback: res => {
        if (res.success) {
          this.reloadData();
          if (handlerPopoverHide) handlerPopoverHide();
        }
      },
    });
  };

  del = (data, e) => {
    if (e) e.stopPropagation();
    const { dispatch } = this.props;
    this.setState(
      {
        dealId: data.id,
      },
      () => {
        dispatch({
          type: 'budgetType/del',
          payload: {
            id: data.id,
          },
          callback: res => {
            if (res.success) {
              this.setState({
                dealId: null,
              });
              this.reloadData();
            }
          },
        });
      },
    );
  };

  frozen = (data, e) => {
    if (e) e.stopPropagation();
    const { dispatch } = this.props;
    this.setState(
      {
        dealId: data.id,
      },
      () => {
        dispatch({
          type: 'budgetType/frozen',
          payload: {
            id: data.id,
            freezing: !get(data, 'frozen'),
          },
          callback: res => {
            if (res.success) {
              this.setState({
                dealId: null,
              });
              this.reloadData();
            }
          },
        });
      },
    );
  };

  privateReference = (data, e) => {
    if (e) e.stopPropagation();
    const { dispatch, budgetType } = this.props;
    const { currentMaster } = budgetType;
    this.setState(
      {
        dealId: data.id,
      },
      () => {
        dispatch({
          type: 'budgetType/privateReference',
          payload: {
            id: data.id,
            subjectId: get(currentMaster, 'id'),
          },
          callback: res => {
            if (res.success) {
              this.setState({
                dealId: null,
              });
              this.reloadData();
            }
          },
        });
      },
    );
  };

  handlerSelect = (keys, items) => {
    const { dispatch } = this.props;
    const selectedBudgetType = keys.length === 1 ? items[0] : null;
    dispatch({
      type: 'budgetType/updateState',
      payload: {
        selectedBudgetType,
      },
    });
  };

  handlerSearchChange = v => {
    this.listCardRef.handlerSearchChange(v);
  };

  handlerPressEnter = () => {
    this.listCardRef.handlerPressEnter();
    this.manualSelect();
  };

  handlerSearch = v => {
    this.listCardRef.handlerSearch(v);
    this.manualSelect();
  };

  manualSelect = () => {
    if (this.listCardRef) {
      const { budgetType } = this.props;
      const { selectedBudgetType } = budgetType;
      const selectedKeys = selectedBudgetType ? [selectedBudgetType.id] : [];
      this.listCardRef.manualUpdateItemChecked(selectedKeys);
    }
  };

  renderCustomTool = () => (
    <>
      <Search
        allowClear
        placeholder="输入名称关键字查询"
        onChange={e => this.handlerSearchChange(e.target.value)}
        onSearch={this.handlerSearch}
        onPressEnter={this.handlerPressEnter}
        style={{ width: '100%' }}
      />
    </>
  );

  renderEditAndDelete = item => {
    if (item.frozen) {
      return null;
    }
    const { dealId } = this.state;
    const { loading, budgetType } = this.props;
    const { currentMaster } = budgetType;
    const saving = loading.effects['budgetType/save'];
    return (
      <>
        <BudgetEdit master={currentMaster} saving={saving} save={this.save} rowData={item} />
        <Popconfirm
          title={formatMessage({
            id: 'global.delete.confirm',
            defaultMessage: '确定要删除吗?',
          })}
          onConfirm={e => this.del(item, e)}
        >
          {loading.effects['budgetType/del'] && dealId === item.id ? (
            <ExtIcon className={cls('del', 'action-item', 'loading')} type="loading" antd />
          ) : (
            <ExtIcon className={cls('del', 'action-item')} type="delete" antd />
          )}
        </Popconfirm>
      </>
    );
  };

  renderItemAction = item => {
    const { budgetType } = this.props;
    const { selectTypeClass } = budgetType;
    const { loading } = this.props;
    const { dealId } = this.state;
    if (selectTypeClass.key === TYPE_CLASS.GENERAL.key) {
      return (
        <>
          <div className="tool-action" onClick={e => e.stopPropagation()}>
            {this.renderEditAndDelete(item)}
            <Popconfirm
              title={item.frozen ? '确定要启用吗?' : '确定要停用吗?'}
              onConfirm={e => this.frozen(item, e)}
            >
              {loading.effects['budgetType/frozen'] && dealId === item.id ? (
                <ExtIcon className={cls('frozen', 'action-item', 'loading')} type="loading" antd />
              ) : (
                <ExtIcon
                  className={cls('frozen', 'action-item')}
                  type={item.frozen ? 'check-circle' : 'close-circle'}
                  antd
                />
              )}
            </Popconfirm>
          </div>
        </>
      );
    }
    if (selectTypeClass.key === TYPE_CLASS.PRIVATE.key) {
      const budgetTypeClass = TYPE_CLASS[get(item, 'type')];
      return (
        <>
          <div className="tool-action" onClick={e => e.stopPropagation()}>
            {budgetTypeClass.key === TYPE_CLASS.PRIVATE.key ? (
              <>
                {this.renderEditAndDelete(item)}
                <Popconfirm
                  title={item.frozen ? '确定要启用吗?' : '确定要停用吗?'}
                  onConfirm={e => this.frozen(item, e)}
                >
                  {loading.effects['budgetType/frozen'] && dealId === item.id ? (
                    <ExtIcon className={cls('del', 'action-item', 'loading')} type="loading" antd />
                  ) : (
                    <ExtIcon
                      className={cls('del', 'action-item')}
                      type={item.frozen ? 'check-circle' : 'close-circle'}
                      antd
                    />
                  )}
                </Popconfirm>
              </>
            ) : (
              <Popconfirm
                title="确定转为私有预算类型吗?"
                onConfirm={e => this.privateReference(item, e)}
              >
                {loading.effects['budgetType/privateReference'] && dealId === item.id ? (
                  <ExtIcon
                    className={cls('frozen', 'action-item', 'loading')}
                    type="loading"
                    antd
                  />
                ) : (
                  <ExtIcon className={cls('frozen', 'action-item')} type="copy" antd />
                )}
              </Popconfirm>
            )}
          </div>
        </>
      );
    }
  };

  renderName = item => {
    const frozen = get(item, 'frozen');
    return (
      <>
        {get(item, 'name')}
        {frozen === true ? (
          <span style={{ color: '#f5222d', fontSize: 12, marginLeft: 8 }}>已停用</span>
        ) : null}
        <span className="use-tip">
          用途:
          {this.renderTypeClass(item)}
        </span>
      </>
    );
  };

  renderDescription = item => {
    const periodType = PERIOD_TYPE[get(item, 'periodType')];
    const classification = MASTER_CLASSIFICATION[get(item, 'classification')];
    return (
      <>
        <div style={{ marginBottom: 8 }}>
          <Space>
            <span>
              期间类型: <Tag style={{ borderColor: 'transparent' }}>{get(periodType, 'title')}</Tag>
            </span>
            <span>
              预算分类:
              <Tag style={{ borderColor: 'transparent' }}>{get(classification, 'title')}</Tag>
            </span>
          </Space>
        </div>
      </>
    );
  };

  renderType = item => {
    const { budgetType } = this.props;
    const { selectTypeClass } = budgetType;
    const budgetTypeClass = TYPE_CLASS[get(item, 'type')];
    if (budgetTypeClass && selectTypeClass.key === TYPE_CLASS.PRIVATE.key) {
      return (
        <Avatar
          shape="square"
          style={{ backgroundColor: budgetTypeClass.color, verticalAlign: 'middle' }}
        >
          {budgetTypeClass.alias}
        </Avatar>
      );
    }
    return null;
  };

  renderTypeClass = item => {
    const orderCategories = get(item, 'orderCategories') || [];
    return (
      <>
        {orderCategories.map(itKey => {
          const it = ORDER_CATEGORY[itKey];
          if (it) {
            return <span key={itKey}>{it.title}</span>;
          }
          return null;
        })}
      </>
    );
  };

  render() {
    const { loading, budgetType } = this.props;
    const { selectTypeClass, selectedBudgetType, currentMaster } = budgetType;
    const saving = loading.effects['budgetType/save'];
    const selectedKeys = selectedBudgetType ? [selectedBudgetType.id] : [];
    const deployTemplateProps = {
      className: 'left-content',
      title: '预算类型',
      showSearch: false,
      onSelectChange: this.handlerSelect,
      customTool: this.renderCustomTool,
      onListCardRef: ref => (this.listCardRef = ref),
      searchProperties: ['name'],
      selectedKeys,
      extra: <BudgetAdd master={currentMaster} saving={saving} save={this.save} />,
      itemField: {
        avatar: ({ item }) => this.renderType(item),
        title: item => this.renderName(item),
        description: item => this.renderDescription(item),
      },
      itemTool: this.renderItemAction,
    };
    if (selectTypeClass.key === TYPE_CLASS.GENERAL.key) {
      Object.assign(deployTemplateProps, {
        store: {
          url: `${SERVER_PATH}/bems-v6/category/findByGeneral`,
        },
      });
    }
    if (selectTypeClass.key === TYPE_CLASS.PRIVATE.key) {
      Object.assign(deployTemplateProps, {
        store: {
          url: `${SERVER_PATH}/bems-v6/category/findBySubject`,
        },
        cascadeParams: {
          subjectId: get(currentMaster, 'id'),
        },
      });
    }
    return (
      <div className={cls(styles['container-box'])}>
        <Layout className="auto-height">
          <Sider width={420} className="auto-height" theme="light">
            <ListCard key={selectTypeClass.key} {...deployTemplateProps} />
          </Sider>
          <Content className={cls('main-content', 'auto-height')} style={{ paddingLeft: 4 }}>
            {selectedBudgetType ? (
              <AssignedDimension onRef={this.handlerAssignedRef} />
            ) : (
              <div className="blank-empty">
                <Empty image={empty} description="可选择预算类型配置预算维度" />
              </div>
            )}
          </Content>
        </Layout>
      </div>
    );
  }
}
export default BudgetTypeList;
