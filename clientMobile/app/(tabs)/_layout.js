import { Tabs } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Sidebar from '../../components/Sidebar';

export default function TabsLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              style={{ marginRight: 16 }}
            >
              <MaterialCommunityIcons name="menu" size={28} color="#5f6368" />
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
          tabBarStyle: {
            ...styles.tabBar,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: 'הקבצים שלי',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons 
                name={focused ? "folder" : "folder-outline"} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            tabBarLabel: 'חיפוש',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons 
                name="magnify" 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: 'פרופיל',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons 
                name={focused ? "account" : "account-outline"} 
                size={24} 
                color={color} 
              />
            ),
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
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});