import { Tabs } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

export default function TabsLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              style={{ marginRight: 16 }}
            >
              <Text style={{ fontSize: 24 }}>☰</Text>
            </TouchableOpacity>
          ),
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderBottomColor: '#e8eaed',
          },
          tabBarActiveTintColor: '#1a73e8',
          tabBarInactiveTintColor: '#80868b',
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
        <Tabs.Screen
          name="my-storage"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="shared"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="recent"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="starred"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="trash"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="spam"
          options={{ href: null }}
        />
      </Tabs>

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onRefresh={() => {
          setSidebarVisible(false);
          // Trigger refresh in current screen
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
    height: 56,
    paddingBottom: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});