import { Tabs } from 'expo-router';

const colors = {
  background: '#FAF7F0',
  border: '#E6DFD2',
  inactive: '#777285',
  primary: '#242A72',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Remember' }} />
      <Tabs.Screen name="archive" options={{ title: 'Archive' }} />
    </Tabs>
  );
}
