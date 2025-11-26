import React from 'react'
import { Col, DatePicker, Form, Input, Row, Select } from 'antd'
import type { FilterItem } from './types'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

type Props = {
  filters: FilterItem[]
  i18nNs?: string
  actions?: React.ReactNode
}

export default function FilterBar({ filters, i18nNs, actions }: Props) {
  const { t } = useTranslation(i18nNs)
  const { t: tc } = useTranslation('common')

  return (
    <Row gutter={16}>
      {filters.map((f) => (
        <Col key={f.name} span={calcSpan(f.component)}>
          <Form.Item name={f.name} label={f.label ?? (f.labelKey ? t(f.labelKey) : undefined)}>
            {renderField(f, tc)}
          </Form.Item>
        </Col>
      ))}
      {/* {actions && (<div style={{display: 'flex', alignItems: 'center', marginLeft: 6 }}>{actions}</div>)} */}
      {actions && (
        <Col span={6}>
          <Form.Item>
            {actions}
          </Form.Item>
        </Col>
      )}
    </Row>
  )
}

function calcSpan(component: string) {
  if (component === 'dateRange') return 12
  return 6
}

function renderField(f: FilterItem, tc: (k: string) => string) {
  if (f.component === 'input') {
    return <Input allowClear placeholder={tc('inputPlaceholder')} {...(f.props || {})} />
  }
  if (f.component === 'number') {
    return <Input type="number" allowClear placeholder={tc('inputPlaceholder')} {...(f.props || {})} />
  }
  if (f.component === 'select') {
    return <Select allowClear placeholder={tc('selectPlaceholder')} {...(f.props || {})} />
  }
  if (f.component === 'multiSelect') {
    return <Select mode="multiple" allowClear placeholder={tc('selectPlaceholder')} {...(f.props || {})} />
  }
  if (f.component === 'dateRange') {
    return (
      <RangePicker
        style={{ width: '100%' }}
        disabledDate={(d) => d.isAfter(dayjs())}
        {...(f.props || {})}
      />
    )
  }
  return f.props?.render ? f.props.render() : null
}
