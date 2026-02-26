import React, { useState, useEffect, useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import normalize from 'react-native-normalize';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../config/color';
import { useToast } from './Toast';
import { getApiInstance } from '../utils/api';

type Playlist = {
    id: number;
    name: string;
    description: string;
    is_public: boolean;
    cover_image: string | null;
};

type AddToPlaylistModalProps = {
    visible: boolean;
    onClose: () => void;
    musicId: number | undefined;
    userId: number | undefined;
};

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
    visible,
    onClose,
    musicId,
    userId,
}) => {
    const { showToast } = useToast();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchPlaylists = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const api = await getApiInstance();
            const response = await api.get(`/api/playlists?user_id=${userId}`);
            const data = response.data?.data || response.data || [];
            setPlaylists(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Error fetching playlists:', error);
            showToast({
                message: error.response?.data?.message || 'Gagal memuat playlist',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [userId, showToast]);

    useEffect(() => {
        if (visible) {
            fetchPlaylists();
            setShowCreateInput(false);
            setNewPlaylistName('');
        }
    }, [visible, fetchPlaylists]);

    const handleAddToPlaylist = async (playlistId: number) => {
        if (!musicId) {
            showToast({ message: 'Music ID tidak tersedia', type: 'error' });
            return;
        }

        try {
            setAdding(true);
            const api = await getApiInstance();
            await api.post('/api/playlist-songs', {
                music_id: musicId,
                playlist_id: playlistId,
                position: 0,
            });
            showToast({ message: 'Berhasil ditambahkan ke playlist', type: 'success' });
            onClose();
        } catch (error: any) {
            console.error('Error adding to playlist:', error);
            showToast({
                message: error.response?.data?.message || 'Gagal menambahkan ke playlist',
                type: 'error',
            });
        } finally {
            setAdding(false);
        }
    };

    const handleCreatePlaylist = async () => {
        const name = newPlaylistName.trim();
        if (!name) {
            showToast({ message: 'Nama playlist tidak boleh kosong', type: 'error' });
            return;
        }

        try {
            setCreating(true);
            const api = await getApiInstance();
            const response = await api.post('/api/playlists', {
                name,
                is_public: true,
                cover_image: '',
                description: '',
                user_id: userId,
            });

            const newPlaylist = response.data?.data;
            console.log(newPlaylist, 'newPlaylist');

            if (newPlaylist?.id && musicId) {
                // Auto-add the song to the newly created playlist
                try {
                    await api.post('/api/playlist-songs', {
                        music_id: musicId,
                        playlist_id: newPlaylist.id,
                        position: 0,
                    });
                    showToast({ message: `Playlist "${name}" dibuat & lagu ditambahkan`, type: 'success' });
                } catch (addError: any) {
                    console.error('Error adding song to new playlist:', addError);
                    showToast({ message: `Playlist "${name}" dibuat, tapi gagal menambahkan lagu`, type: 'error' });
                }
            } else {
                showToast({ message: `Playlist "${name}" berhasil dibuat`, type: 'success' });
            }

            onClose();
        } catch (error: any) {
            console.error('Error creating playlist:', error);
            showToast({
                message: error.response?.data?.message || 'Gagal membuat playlist',
                type: 'error',
            });
        } finally {
            setCreating(false);
        }
    };

    const renderPlaylistItem = ({ item }: { item: Playlist }) => (
        <TouchableOpacity
            style={styles.playlistItem}
            activeOpacity={0.7}
            disabled={adding}
            onPress={() => handleAddToPlaylist(item.id)}
        >
            {item.cover_image ? (
                <Image source={{ uri: item.cover_image }} style={styles.playlistCover} />
            ) : (
                <View style={[styles.playlistCover, styles.playlistCoverPlaceholder]}>
                    <FontAwesome6 name="music" size={20} color="rgba(255,255,255,0.4)" />
                </View>
            )}
            <View style={styles.playlistInfo}>
                <Text style={styles.playlistName} numberOfLines={1}>
                    {item.name}
                </Text>
                {item.description ? (
                    <Text style={styles.playlistDescription} numberOfLines={1}>
                        {item.description}
                    </Text>
                ) : null}
            </View>
            <FontAwesome6 name="plus" size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View />
            </TouchableOpacity>

            <View style={styles.container}>
                {/* Handle bar */}
                <View style={styles.handleBar} />

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Tambah ke Playlist</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <FontAwesome6 name="xmark" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Create new playlist */}
                <TouchableOpacity
                    style={styles.createButton}
                    activeOpacity={0.7}
                    onPress={() => setShowCreateInput(!showCreateInput)}
                >
                    <View style={[styles.playlistCover, styles.createIconContainer]}>
                        <FontAwesome6 name="plus" size={20} color="#fff" />
                    </View>
                    <Text style={styles.createButtonText}>Buat Playlist Baru</Text>
                </TouchableOpacity>

                {showCreateInput && (
                    <View style={styles.createInputContainer}>
                        <TextInput
                            style={styles.createInput}
                            placeholder="Nama playlist..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={newPlaylistName}
                            onChangeText={setNewPlaylistName}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[
                                styles.createSubmitButton,
                                (!newPlaylistName.trim() || creating) && styles.createSubmitButtonDisabled,
                            ]}
                            disabled={!newPlaylistName.trim() || creating}
                            onPress={handleCreatePlaylist}
                        >
                            {creating ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.createSubmitText}>Buat</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Playlist list */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : playlists.length > 0 ? (
                    <FlatList
                        data={playlists}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderPlaylistItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <FontAwesome6 name="folder-open" size={40} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptyText}>Belum ada playlist</Text>
                        <Text style={styles.emptySubText}>
                            Buat playlist baru untuk menyimpan lagu favorit
                        </Text>
                    </View>
                )}

                {adding && (
                    <View style={styles.addingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.addingText}>Menambahkan...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: normalize(20),
        borderTopRightRadius: normalize(20),
        maxHeight: '70%',
        paddingBottom: normalize(30),
    },
    handleBar: {
        width: normalize(40),
        height: normalize(4),
        borderRadius: normalize(2),
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignSelf: 'center',
        marginTop: normalize(12),
        marginBottom: normalize(8),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(12),
    },
    title: {
        color: '#fff',
        fontSize: normalize(18),
        fontWeight: '700',
    },
    closeButton: {
        width: normalize(36),
        height: normalize(36),
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(12),
        gap: normalize(12),
    },
    createIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: normalize(15),
        fontWeight: '600',
    },
    createInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: normalize(20),
        paddingBottom: normalize(12),
        gap: normalize(10),
    },
    createInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: normalize(10),
        paddingHorizontal: normalize(14),
        paddingVertical: normalize(10),
        color: '#fff',
        fontSize: normalize(14),
    },
    createSubmitButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: normalize(18),
        paddingVertical: normalize(10),
        borderRadius: normalize(10),
    },
    createSubmitButtonDisabled: {
        opacity: 0.5,
    },
    createSubmitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: normalize(14),
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: normalize(20),
    },
    listContent: {
        paddingHorizontal: normalize(20),
        paddingTop: normalize(8),
    },
    playlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: normalize(10),
        gap: normalize(12),
    },
    playlistCover: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(8),
    },
    playlistCoverPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playlistInfo: {
        flex: 1,
    },
    playlistName: {
        color: '#fff',
        fontSize: normalize(15),
        fontWeight: '600',
    },
    playlistDescription: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: normalize(12),
        marginTop: normalize(2),
    },
    loadingContainer: {
        paddingVertical: normalize(40),
        alignItems: 'center',
    },
    emptyContainer: {
        paddingVertical: normalize(40),
        alignItems: 'center',
        gap: normalize(8),
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: normalize(16),
        fontWeight: '600',
        marginTop: normalize(8),
    },
    emptySubText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: normalize(13),
        textAlign: 'center',
        paddingHorizontal: normalize(40),
    },
    addingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopLeftRadius: normalize(20),
        borderTopRightRadius: normalize(20),
        alignItems: 'center',
        justifyContent: 'center',
        gap: normalize(12),
    },
    addingText: {
        color: '#fff',
        fontSize: normalize(14),
        fontWeight: '600',
    },
});

export default AddToPlaylistModal;
