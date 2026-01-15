import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'הקבצים שלי',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📁</Text>,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarLabel: 'חיפוש',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'פרופיל',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="files/[id]"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});