import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import NewMenu from './NewMenu';
import { SIDEBAR_MENU, SIDEBAR_PATHS } from '../consts/Sidebar';

const Sidebar = ({ visible, onClose, onNavigate, currentFolderId = null, onRefresh }) => {
  const router = useRouter();

  const menuItems = [
    {
      name: SIDEBAR_MENU.HOME,
      icon: '🏠',
      path: SIDEBAR_PATHS.HOME,
      action: () => {
        router.push('/(tabs)/index');
        onClose();
      }
    },
    {
      name: SIDEBAR_MENU.MY_STORAGE,
      icon: '💾',
      path: SIDEBAR_PATHS.MY_STORAGE,
      action: () => {
        router.push('/(tabs)/my-storage');
        onClose();
      }
    },
    {
      name: SIDEBAR_MENU.SHARED,
      icon: '👥',
      path: SIDEBAR_PATHS.SHARED,
      action: () => {
        router.push('/(tabs)/shared');
        onClose();
      }
    },
    {
      name: SIDEBAR_MENU.RECENT,
      icon: '🕐',
      path: SIDEBAR_PATHS.RECENT,
      action: () => {
        router.push('/(tabs)/recent');
        onClose();
      }
    },
    {
      name: SIDEBAR_MENU.STARRED,
      icon: '⭐',
      path: SIDEBAR_PATHS.STARRED,
      action: () => {
        router.push('/(tabs)/starred');
        onClose();
      }
    },
    {
      name: SIDEBAR_MENU.TRASH,
      icon: '🗑️',
      path: SIDEBAR_PATHS.TRASH,
      action: () => {
        router.push('/(tabs)/trash');
        onClose();
      }
    },
    {
      name: SIDEBAR_MENU.SPAM,
      icon: '⚠️',
      path: SIDEBAR_PATHS.SPAM,
      action: () => {
        router.push('/(tabs)/spam');
        onClose();
      }
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerText}>תפריט</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.newMenuContainer}>
              <NewMenu
                onUpload={onRefresh}
                currentFolderId={currentFolderId}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItemsContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sidebarItem}
                  onPress={item.action}
                >
                  <Text style={styles.sidebarItemIcon}>{item.icon}</Text>
                  <Text style={styles.sidebarItemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default Sidebar;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: '80%',
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#202124',
  },
  closeButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#5f6368',
  },
  scrollView: {
    flex: 1,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
    marginVertical: 8,
  },
  newMenuContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  menuItemsContainer: {
    paddingHorizontal: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: 24,
    backgroundColor: 'transparent',
    gap: 16,
  },
  sidebarItemIcon: {
    fontSize: 20,
  },
  sidebarItemText: {
    fontSize: 14,
    color: '#202124',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});
