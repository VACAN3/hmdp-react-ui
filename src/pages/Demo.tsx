import React from 'react';
import { Table, Typography, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Title level={3}>{t('demo.title')}</Typography.Title>
      {isError && <Typography.Text type="danger">{t('demo.loadError')}</Typography.Text>}
      <Table<User>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: t('demo.name'), dataIndex: 'name' },
          { title: t('demo.email'), dataIndex: 'email' },
          { title: t('demo.phone'), dataIndex: 'phone' },
          { title: t('demo.website'), dataIndex: 'website' },
        ]}
      />
    </Space>
  );
}
