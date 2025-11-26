import React, { useEffect } from 'react'
import { Form, Input, Select, Button, Row, Col, Spin } from 'antd'
import type { UserInfoVO } from '@/api/system/user'
import { useTranslation } from 'react-i18next'
import { message } from 'antd'

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
  const { t } = useTranslation('profile')

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
    message.info(t("saveSuccess"))
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="userName" label={t("userName")}>
            <Input placeholder="—" disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="deptName" label={t("deptName")}>
            <Input placeholder="—" disabled />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="nickName" label={t("nickName")}>
            <Input placeholder={t("nickNamePlaceholder")} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="phonenumber" label={t("phone")}>
            <Input placeholder={t("phonePlaceholder")} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="email" label={t("email")}>
            <Input placeholder={t("emailPlaceholder")} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="sex" label={t("sex")}>
            <Select placeholder={t("sexPlaceholder")}>
              <Select.Option value="0">{t("male")}</Select.Option>
              <Select.Option value="1">{t("female")}</Select.Option>
              <Select.Option value="2">{t("unknown")}</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="roleGroup" label={t("roleGroup")}>
            <Input placeholder="—" disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="postGroup" label={t("postGroup")}>
            <Input placeholder="—" disabled />
          </Form.Item>
        </Col>
      </Row>
      <div style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit">
          {t("save")}
        </Button>
      </div>
    </Form>
  )
}
