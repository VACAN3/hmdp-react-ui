import React, { useEffect } from 'react'
import { Form, Input, Select, Button, Row, Col, Spin } from 'antd'
import type { UserInfoVO } from '@/api/system/user'

type FormValues = {
  userName?: string
  nickName?: string
  phonenumber?: string
  email?: string
  sex?: string
  deptName?: string
  roleGroup?: string
  postGroup?: string
}

export default function UserInfo({ profile }: { profile: UserInfoVO | null }) {
  const [form] = Form.useForm<FormValues>()

  useEffect(() => {
    if (!profile) return
    const user = profile.user || {}
    form.setFieldsValue({
      userName: user.userName,
      nickName: user.nickName,
      phonenumber: user.phonenumber,
      email: user.email,
      sex: user.sex,
      deptName: user.dept?.deptName,
      roleGroup: profile.roleGroup,
      postGroup: profile.postGroup,
    })
  }, [profile])

  const onFinish = async (values: FormValues) => {
    // 业务保存逻辑由你接入，此处先占位
    console.log('提交用户资料：', values)
    message.info('保存逻辑待接入（仅接入数据源与表单展示）')
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="userName" label="用户名称">
            <Input placeholder="—" disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="deptName" label="所属部门">
            <Input placeholder="—" disabled />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="nickName" label="用户昵称">
            <Input placeholder="请输入昵称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="phonenumber" label="手机号码">
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="email" label="用户邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="sex" label="性别">
            <Select placeholder="请选择">
              <Select.Option value="0">男</Select.Option>
              <Select.Option value="1">女</Select.Option>
              <Select.Option value="2">未知</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="roleGroup" label="所属角色">
            <Input placeholder="—" disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="postGroup" label="所属岗位">
            <Input placeholder="—" disabled />
          </Form.Item>
        </Col>
      </Row>
      <div style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit">保存</Button>
      </div>
    </Form>
  )
}
