import React from 'react';
import { Table, Typography, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
}

const fetchUsers = async (): Promise<User[]> => {
  const { data } = await axios.get('https://jsonplaceholder.typicode.com/users');
  return data;
};

export default function Demo() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Title level={3}>示范页面：客户列表</Typography.Title>
      {isError && <Typography.Text type="danger">加载失败，请重试</Typography.Text>}
      <Table<User>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: '姓名', dataIndex: 'name' },
          { title: '邮箱', dataIndex: 'email' },
          { title: '电话', dataIndex: 'phone' },
          { title: '网站', dataIndex: 'website' },
        ]}
      />
    </Space>
  );
}
