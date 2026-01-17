import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NewMenu from './NewMenu';
import { SIDEBAR_MENU, SIDEBAR_PATHS } from '../consts/Sidebar';

const Sidebar = ({ visible, onClose, currentFolderId = null, onRefresh }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleRefresh = () => {
    DeviceEventEmitter.emit('refreshFiles');
    if (onRefresh) onRefresh();
  };

  const menuItems = [
    {
      name: SIDEBAR_MENU.HOME,
      icon: 'folder-outline',
      activeIcon: 'folder',
      path: '/',
      action: () => { router.push('/'); onClose(); }
    },
    {
      name: SIDEBAR_MENU.MY_STORAGE,
      icon: 'cloud-outline',
      activeIcon: 'cloud',
      path: '/my-storage',
      action: () => { router.push('/(tabs)/my-storage'); onClose(); }
    },
    {
      name: SIDEBAR_MENU.SHARED,
      icon: 'account-group-outline',
      activeIcon: 'account-group',
      path: '/shared',
      action: () => { router.push('/(tabs)/shared'); onClose(); }
    },
    {
      name: SIDEBAR_MENU.RECENT,
      icon: 'clock-outline',
      activeIcon: 'clock',
      path: '/recent',
      action: () => { router.push('/(tabs)/recent'); onClose(); }
    },
    {
      name: SIDEBAR_MENU.STARRED,
      icon: 'star-outline',
      activeIcon: 'star',
      path: '/starred',
      action: () => { router.push('/(tabs)/starred'); onClose(); }
    },
    {
      name: SIDEBAR_MENU.TRASH,
      icon: 'delete-outline',
      activeIcon: 'delete',
      path: '/trash',
      action: () => { router.push('/(tabs)/trash'); onClose(); }
    },
    {
      name: SIDEBAR_MENU.SPAM,
      icon: 'alert-octagon-outline',
      activeIcon: 'alert-octagon',
      path: '/spam',
      action: () => { router.push('/(tabs)/spam'); onClose(); }
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
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
              <MaterialCommunityIcons name="close" size={24} color="#5f6368" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.newMenuWrapper}>
              <NewMenu
                onUpload={handleRefresh}
                currentFolderId={currentFolderId}
              />
            </View>

            <View style={styles.menuItemsContainer}>
              {menuItems.map((item, index) => {
                const isActive = pathname === item.path;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sidebarItem,
                      isActive && styles.activeSidebarItem
                    ]}
                    onPress={item.action}
                  >
                    <MaterialCommunityIcons 
                      name={isActive ? item.activeIcon : item.icon} 
                      size={22} 
                      color={isActive ? "#041E49" : "#444746"} 
                    />
                    <Text style={[
                      styles.sidebarItemText,
                      isActive && styles.activeSidebarItemText
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayTouchable: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    width: '80%',
    maxWidth: 280,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start', 
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    alignSelf: 'flex-end'
  },
  newMenuWrapper: {
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  menuItemsContainer: {
    paddingHorizontal: 12,
  },
  sidebarItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 28,
    gap: 12,
  },
  activeSidebarItem: {
    backgroundColor: '#C2E7FF',
  },
  sidebarItemText: {
    fontSize: 14,
    color: '#444746',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  activeSidebarItemText: {
    color: '#041E49',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
});

export default Sidebar;