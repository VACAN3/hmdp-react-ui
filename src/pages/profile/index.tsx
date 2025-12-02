import React from "react";
import { Row, Col, Card, Tabs, message, Spin } from "antd";
import PersonInfo from "./PersonInfo";
import UserInfo from "./UserInfo";
import ResetPwd from "./ResetPwd";
import ThirdParty from "./ThirdParty";
import "./index.css";
import { getUserProfile } from "@/api/system/user";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { t } = useTranslation("profile");

  // 使用 React Query 替代 useEffect 手动获取数据
  const { data: profile, isLoading: loading, error } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    // 出错时显示消息
    meta: {
      errorMessage: t("fetchError")
    }
  });

  // 错误处理副作用（可选，如果在全局 QueryClient 配置了 onError 也可以省略）
  if (error) {
    // 注意：在 render 阶段直接调用 message 可能导致 React 警告，通常建议在 useEffect 或回调中处理
    // 但这里我们利用 useQuery 的状态来控制 UI，错误提示可以交给全局或在这里做一个简单的展示
    // 为了保持原有行为，我们可以只打印日志，具体错误提示由全局拦截器或 queryClient 默认行为处理
    console.error("Profile fetch error:", error);
  }

  const items = [
    {
      key: "userinfo",
      label: t("userinfo"),
      children: <UserInfo profile={profile || null} />,
    },
    {
      key: "resetPwd",
      label: t("resetPwd"),
      children: <ResetPwd profile={profile || null} />,
    },
    {
      key: "thirdParty",
      label: t("thirdParty"),
      children: <ThirdParty profile={profile || null} />,
    },
  ];

  return (
    <div className="profile-page">
      <Row gutter={20}>
        <Col span={12}>
          <PersonInfo profile={profile || null} />
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
