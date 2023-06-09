import React, { Component } from 'react';
import * as XLSX from 'xlsx';
import PropTypes from 'prop-types';
import cls from 'classnames';
import { get } from 'lodash';
import { Button, Empty } from 'antd';
import { ExtModal, BannerTitle, message, ListLoader, Space } from 'suid';
import empty from '@/assets/data_import.svg';
import styles from './index.less';

const FIELDS = [
  { field: 'code', title: '预算科目代码', required: true },
  { field: 'name', title: '预算科目名称', required: true },
];

class BatchItems extends Component {
  static btnFile;

  static propTypes = {
    closeBatchImport: PropTypes.func,
    downloadImportTemplate: PropTypes.func,
    templateDownloding: PropTypes.bool,
    sendImportData: PropTypes.func,
    showImport: PropTypes.bool,
    importDoing: PropTypes.bool,
  };

  static defaultProps = {
    showImport: false,
    importDoing: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      importData: [],
    };
  }

  handleDownloadClick = e => {
    e.stopPropagation();
    const { downloadImportTemplate } = this.props;
    if (downloadImportTemplate && downloadImportTemplate instanceof Function) {
      downloadImportTemplate();
    }
  };

  onSelectFile = e => {
    e.stopPropagation();
    if (this.btnFile) {
      this.btnFile.click();
      this.btnFile.value = '';
    }
  };

  onImportExcel = file => {
    message.destroy();
    // 获取上传的文件对象
    const { files } = file.target;
    // 通过FileReader对象读取文件
    const fileReader = new FileReader();
    fileReader.onload = event => {
      try {
        const { result } = event.target;
        // 以二进制流方式读取得到整份excel表格对象
        const workbook = XLSX.read(result, { type: 'binary' });
        let data = []; // 存储获取到的数据
        // 遍历每张工作表进行读取（这里默认只读取第一张表）
        // eslint-disable-next-line no-restricted-syntax
        for (const sheet in workbook.Sheets) {
          if (workbook.Sheets.hasOwnProperty(sheet)) {
            // 利用 sheet_to_json 方法将 excel 转成 json 数据
            data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
            break; // 如果只取第一张表，就取消注释这行
          }
        }
        if (data.length > 0) {
          const testRow = data[0];
          const propsCount = Object.getOwnPropertyNames(testRow).length;
          const count = FIELDS.length + 1;
          if (propsCount === count) {
            if (data.length > 10001) {
              message.error('导入条数大于1万条，禁止导入');
            } else {
              if (data.length <= 1) {
                message.error('模板没有明细数据');
              }
              this.setState({ importData: data });
            }
          } else {
            message.error('导入的模板不正确');
          }
        } else {
          message.error('模板没有数据');
        }
      } catch {
        // 这里可以抛出文件类型错误不正确的相关提示
        message.error('文件类型不正确');
      }
    };
    // 以二进制方式打开文件
    fileReader.readAsBinaryString(files[0]);
  };

  handlerImportData = () => {
    const { sendImportData } = this.props;
    const { importData } = this.state;
    const data = [];
    const localData = [...importData];
    let dataValid = true;
    let validTip = '导入的模板数据不正确';
    if (localData[0].hasOwnProperty('__EMPTY')) {
      dataValid = false;
    } else {
      for (let i = 1; i < localData.length; i += 1) {
        const tmpData = localData[i];
        const rowData = {};
        for (let k = 0; k < FIELDS.length; k += 1) {
          const { field, title, required } = FIELDS[k];
          if (tmpData.hasOwnProperty(field)) {
            tmpData[field] = tmpData[field].toString().trim();
            const validResult = this.checkImportDataValid(field, title, tmpData, i);
            validTip = get(validResult, 'validTip', '');
            dataValid = get(validResult, 'dataValid', true);
            if (dataValid) {
              rowData[field] = tmpData[field];
            } else {
              break;
            }
          } else if (required) {
            validTip = `第【${i + 2}】行【${title}】数据为空，或模板中不存在该字段!`;
            dataValid = false;
            break;
          }
        }
        if (!dataValid) {
          break;
        } else {
          data.push(rowData);
        }
      }
    }
    if (dataValid) {
      sendImportData(data);
    } else {
      message.destroy();
      message.error(validTip);
    }
  };

  checkImportDataValid = field => {
    const dataValid = true;
    const validTip = '';
    switch (field) {
      default:
        break;
    }
    return {
      validTip,
      dataValid,
    };
  };

  handlerCloseImport = refresh => {
    this.setState({ importData: [] }, () => {
      const { closeBatchImport } = this.props;
      if (closeBatchImport) {
        closeBatchImport(refresh);
      }
    });
  };

  handlerFinishedImport = () => {
    this.handlerCloseImport(true);
  };

  renderImportStart = () => {
    const { importData } = this.state;
    const { templateDownloding, importDoing } = this.props;
    const importCount = importData.length > 1 ? importData.length - 1 : 0;
    return (
      <>
        <Space direction="vertical" size={32} style={{ width: '100%', marginTop: 64 }}>
          <Empty
            key="data-empty"
            className="data-empty"
            image={empty}
            description="选择模板电子表格文件(.xlsx, .xls)"
          >
            <Space>
              <Button type="primary" ghost size="small" onClick={this.onSelectFile}>
                选择文件
                <input
                  style={{ display: 'none' }}
                  ref={node => (this.btnFile = node)}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={this.onImportExcel}
                />
              </Button>
              <Button
                type="primary"
                disabled={importData.length <= 1}
                loading={importDoing}
                size="small"
                onClick={this.handlerImportData}
              >
                {`开始导入(${importCount})`}
              </Button>
            </Space>
          </Empty>
        </Space>
        <div className="tool-box">
          <Space>
            <Button
              size="small"
              onClick={this.handleDownloadClick}
              loading={templateDownloding}
              type="link"
            >
              导入模板下载
            </Button>
          </Space>
        </div>
      </>
    );
  };

  render() {
    const { showImport, importDoing } = this.props;
    return (
      <ExtModal
        destroyOnClose
        closable={!importDoing}
        keyboard={false}
        visible={showImport}
        centered
        footer={null}
        wrapClassName={cls(styles['batch-import-box'])}
        maskClosable={false}
        bodyStyle={{ padding: 0, height: 420 }}
        title={<BannerTitle title="预算科目" subTitle="批量导入" />}
        onCancel={this.handlerCloseImport}
      >
        {importDoing ? (
          <div className="vertical progress-box">
            正在导入...
            <ListLoader />
          </div>
        ) : (
          this.renderImportStart()
        )}
      </ExtModal>
    );
  }
}

export default BatchItems;
