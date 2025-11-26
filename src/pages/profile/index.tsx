import React, { useEffect, useState } from "react";
import { Row, Col, Card, Tabs, message, Spin } from "antd";
import PersonInfo from "./PersonInfo";
import UserInfo from "./UserInfo";
import ResetPwd from "./ResetPwd";
import ThirdParty from "./ThirdParty";
import "./index.css";
import { getUserProfile } from "@/api/system/user";
import type { UserInfoVO } from "@/api/system/user";
import { useTranslation } from "react-i18next";

export default function Profile() {
  const { t } = useTranslation("profile");
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserInfoVO | null>(null);
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setProfile(data);
      } catch (e: any) {
        message.error(e?.message || t("fetchError"));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const items = [
    {
      key: "userinfo",
      label: t("userinfo"),
      children: <UserInfo profile={profile} />,
    },
    {
      key: "resetPwd",
      label: t("resetPwd"),
      children: <ResetPwd profile={profile} />,
    },
    {
      key: "thirdParty",
      label: t("thirdParty"),
      children: <ThirdParty profile={profile} />,
    },
  ];

  return (
    <div className="profile-page">
      <Row gutter={20}>
        <Col span={12}>
          <PersonInfo profile={profile} />
        </Col>
        <Col span={12}>
          <Card title={t("basicInfo")}>
            <Spin spinning={loading}>
              <Tabs defaultActiveKey="userinfo" items={items} />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
