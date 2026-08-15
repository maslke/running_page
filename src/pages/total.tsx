import ActivityList from '@/components/ActivityList';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { useTheme } from '@/hooks/useTheme';

const HomePage = () => {
  const { theme } = useTheme();

  return (
    <Layout>
      <Helmet>
        <html lang="en" data-theme={theme} />
      </Helmet>
      <ActivityList />
    </Layout>
  );
};

export default HomePage;
