import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, RefreshControl, Image,
  Platform, Linking, Dimensions,
} from 'react-native';
import { getCoupons, getMyCoupons, claimCoupon, getLocalDeals } from '../services/api';
import { useStore } from '../store/useStore';

const { width: SW, height: SH } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

type Tab = 'local' | 'saved' | 'online' | 'points';

// ── Deals en ligne curatés (URLs officielles canadiennes) ─────────────────────
const ONLINE_DEALS = [
  {
    id: 'amazon',
    store: 'Amazon.ca',
    emoji: '📦',
    title: 'Ventes du jour',
    description: 'Offres quotidiennes à -70% sur électronique, cuisine, mode, maison',
    badge: 'Mise à jour chaque heure',
    url: 'https://www.amazon.ca/deals',
    badgeColor: '#FF9900',
  },
  {
    id: 'walmart',
    store: 'Walmart Canada',
    emoji: '🏪',
    title: 'Prix roulants & Dégagement',
    description: 'Rabais permanents sur épicerie, électronique et articles ménagers',
    badge: 'Rollbacks',
    url: 'https://www.walmart.ca/en/deals',
    badgeColor: '#0071CE',
  },
  {
    id: 'bestbuy',
    store: 'Best Buy Canada',
    emoji: '🖥️',
    title: 'Deals de la semaine',
    description: 'TV, ordinateurs, téléphones, électroménagers en rabais',
    badge: 'Tech',
    url: 'https://www.bestbuy.ca/en-ca/collection/best-buy-deals/BI-16624',
    badgeColor: '#1259AE',
  },
  {
    id: 'ctire',
    store: 'Canadian Tire',
    emoji: '🍁',
    title: 'Circulaire de la semaine',
    description: "Outils, sports, auto, jardin — jusqu'à 50% de rabais",
    badge: 'Circulaire',
    url: 'https://www.canadiantire.ca/en/flyer.html',
    badgeColor: '#CC0000',
  },
  {
    id: 'iga',
    store: 'IGA',
    emoji: '🛒',
    title: 'Circulaire IGA',
    description: 'Spéciaux de la semaine sur viandes, fruits, légumes et épicerie',
    badge: 'Épicerie',
    url: 'https://www.iga.net/en/flyer',
    badgeColor: '#E30513',
  },
  {
    id: 'metro',
    store: 'Metro',
    emoji: '🏬',
    title: 'Circulaire Metro',
    description: 'Offres hebdomadaires sur tous les rayons',
    badge: 'Épicerie',
    url: 'https://www.metro.ca/en/flyer',
    badgeColor: '#003DA5',
  },
  {
    id: 'pharmaprix',
    store: 'Pharmaprix',
    emoji: '💊',
    title: 'Offres Pharmaprix',
    description: 'Beauté, santé, médicaments — points bonus & rabais en store',
    badge: 'Santé & Beauté',
    url: 'https://www.pharmaprix.ca/en/flyer',
    badgeColor: '#E4002B',
  },
  {
    id: 'ikea',
    store: 'IKEA Canada',
    emoji: '🛋️',
    title: 'Offres IKEA',
    description: 'Meubles, déco et accessoires en promotion cette semaine',
    badge: 'Maison',
    url: 'https://www.ikea.com/ca/en/offers/',
    badgeColor: '#0051BA',
  },
  {
    id: 'simons',
    store: 'Simons',
    emoji: '👗',
    title: 'Soldes Simons',
    description: 'Mode femme, homme, enfant — vêtements et accessoires réduits',
    badge: 'Mode',
    url: 'https://www.simons.ca/en/sale',
    badgeColor: '#8B5CF6',
  },
  {
    id: 'cf',
    store: 'Cadillac Fairview',
    emoji: '🏢',
    title: 'Deals en galerie',
    description: 'Offres exclusives dans les centres commerciaux CF près de toi',
    badge: 'Centre commercial',
    url: 'https://www.cfshops.com/en/deals-and-promotions.html',
    badgeColor: '#D97706',
  },
];

const STORE_EMOJIS: Record<string, string> = {
  iga: '🛒', metro: '🛒', maxi: '🛒', walmart: '🛒', 'super c': '🛒',
  provigo: '🛒', 'jean coutu': '💊', pharmaprix: '💊', adonis: '🌿',
  dollarama: '💲', 'canadian tire': '🍁',
};

function storeEmoji(merchant: string): string {
  const m = merchant.toLowerCase();
  for (const [k, v] of Object.entries(STORE_EMOJIS)) {
    if (m.includes(k)) return v;
  }
  return '🏪';
}

function proxyImg(url: string): string {
  if (!url) return '';
  const base = API_URL.replace('/api', '');
  return `${base}/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function openUrl(url: string) {
  if (!url) return;
  if (Platform.OS === 'web') { (window as any).open(url, '_blank'); }
  else { Linking.openURL(url); }
}

function DealImage({ uri, style }: { uri: string; style: any }) {
  if (Platform.OS === 'web') {
    return (
      <img
        src={uri}
        style={{ ...style, objectFit: 'contain', backgroundColor: '#fff', display: 'block' } as any}
        onError={(e: any) => { e.target.parentNode.style.display = 'none'; }}
      />
    );
  }
  return <Image source={{ uri }} style={style} resizeMode="contain" />;
}

export function RewardsScreen() {
  const postalCode  = useStore((s) => s.postalCode);
  const savedDeals  = useStore((s) => s.savedDeals);
  const saveDeal    = useStore((s) => s.saveDeal);
  const removeSaved = useStore((s) => s.removeSavedDeal);

  const [localDeals,    setLocalDeals]    = useState<any[]>([]);
  const [pointCoupons,  setPointCoupons]  = useState<any[]>([]);
  const [myCoupons,     setMyCoupons]     = useState<any[]>([]);
  const [points,        setPoints]        = useState(0);

  const [tab,       setTab]       = useState<Tab>('local');
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [claiming,  setClaiming]  = useState<string | null>(null);
  const [selected,  setSelected]  = useState<any | null>(null);
  const [cashier,   setCashier]   = useState<any | null>(null);
  const [marking,   setMarking]   = useState(false);

  const load = useCallback(async () => {
    try {
      const pc = postalCode || 'J1H1A1';
      const [local, all, my] = await Promise.all([
        getLocalDeals(pc),
        getCoupons(),
        getMyCoupons(),
      ]);
      setLocalDeals(local);
      setPointCoupons(all);
      setMyCoupons(my.coupons);
      setPoints(my.points);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [postalCode]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleClaim = async (coupon: any) => {
    setClaiming(coupon.id);
    try {
      await claimCoupon(coupon.id);
      Alert.alert('Coupon réclamé !', 'Voir dans "Points".');
      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.error || 'Points insuffisants');
    }
    setClaiming(null);
  };

  const handleMarkUsed = async () => {
    if (!selected || selected.usedAt) return;
    setMarking(true);
    try {
      const token = useStore.getState().token;
      await fetch(`${API_URL}/coupons/use/${selected.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await load();
      setSelected((prev: any) => prev ? { ...prev, usedAt: new Date().toISOString() } : null);
    } catch {}
    setMarking(false);
  };

  const claimedIds = new Set(myCoupons.map((uc: any) => uc.couponId));

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color="#22c55e" size="large" />
      <Text style={s.loadTxt}>Chargement des offres...</Text>
    </View>
  );

  return (
    <View style={s.root}>

      {/* ── Vue caissier plein écran ─────────────────────────────────────── */}
      <Modal visible={!!cashier} transparent={false} animationType="fade" onRequestClose={() => setCashier(null)}>
        {cashier && (
          <View style={s.cashierRoot}>
            <TouchableOpacity style={s.cashierCloseBtn} onPress={() => setCashier(null)}>
              <Text style={s.cashierCloseTxt}>✕  Fermer</Text>
            </TouchableOpacity>
            <View style={s.cashierContent}>
              {cashier.imageUrl
                ? <DealImage uri={proxyImg(cashier.imageUrl)} style={s.cashierImg} />
                : <Text style={{ fontSize: 80 }}>{storeEmoji(cashier.merchant)}</Text>
              }
              <Text style={s.cashierName}>{cashier.name}</Text>
              <Text style={s.cashierMerchant}>{cashier.merchant}</Text>
              {(cashier.saleStory || cashier.priceText) && (
                <View style={s.cashierPriceBox}>
                  <Text style={s.cashierPrice}>{cashier.saleStory || cashier.priceText}</Text>
                </View>
              )}
              {cashier.validUntil && (
                <Text style={s.cashierExpiry}>
                  Valable jusqu'au {new Date(cashier.validUntil).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                </Text>
              )}
              <Text style={s.cashierHint}>Montrez cet écran au caissier</Text>
              <TouchableOpacity style={s.removeSavedBtn} onPress={() => { removeSaved(cashier.id); setCashier(null); }}>
                <Text style={s.removeSavedTxt}>🗑  Retirer de mes sauvegardes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* ── Bon de réduction plein écran ─────────────────────────────────── */}
      <Modal visible={!!selected} transparent={false} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (() => {
          const uc = selected;
          const coupon = uc.coupon || {};
          const isUsed = !!uc.usedAt;
          const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
          const claimedAt = uc.claimedAt ? new Date(uc.claimedAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
          // Barcode unique généré depuis le code
          const seed = uc.code || 'AAAAAAAA';
          const bars = Array.from({ length: 34 }, (_, i) => {
            const c = seed.charCodeAt(i % seed.length) + i * 7;
            return (c % 4) + 1;
          });
          return (
            <View style={s.voucherRoot}>
              {/* Bouton fermer */}
              <TouchableOpacity style={s.voucherClose} onPress={() => setSelected(null)}>
                <Text style={s.voucherCloseTxt}>✕  Fermer</Text>
              </TouchableOpacity>

              <ScrollView contentContainerStyle={s.voucherScroll} showsVerticalScrollIndicator={false}>
                {/* Bon de réduction */}
                <View style={[s.voucher, isUsed && s.voucherUsed]}>

                  {/* En-tête partenaire */}
                  <View style={s.voucherHeader}>
                    <View style={s.voucherHeaderLeft}>
                      <Text style={s.voucherEmoji}>{coupon.imageEmoji || '🎁'}</Text>
                      <View>
                        <Text style={s.voucherPartner}>{coupon.partner}</Text>
                        <Text style={s.voucherCategory}>{coupon.category}</Text>
                      </View>
                    </View>
                    <View style={s.voucherDiscountBadge}>
                      <Text style={s.voucherDiscount}>{coupon.discount}</Text>
                    </View>
                  </View>

                  {/* Ligne pointillée */}
                  <View style={s.voucherDivider} />

                  {/* Titre & description */}
                  <Text style={s.voucherTitle}>{coupon.title}</Text>
                  <Text style={s.voucherDesc}>{coupon.description}</Text>

                  {/* Ligne pointillée */}
                  <View style={s.voucherDivider} />

                  {/* Code-barres unique */}
                  <View style={s.voucherBarcodeWrap}>
                    <View style={s.voucherBarcode}>
                      {bars.map((w, i) => (
                        <View key={i} style={{ width: w, flex: 0, backgroundColor: isUsed ? '#bbb' : '#111', height: i % 5 === 0 ? 52 : 42, alignSelf: 'flex-end', borderRadius: 0.5 }} />
                      ))}
                    </View>
                    <Text style={s.voucherCode}>{uc.code}</Text>
                    <Text style={s.voucherCodeSub}>Code unique lié à votre compte</Text>
                  </View>

                  {/* Ligne pointillée */}
                  <View style={s.voucherDivider} />

                  {/* Infos validité */}
                  <View style={s.voucherMeta}>
                    <View style={s.voucherMetaRow}>
                      <Text style={s.voucherMetaLabel}>Émis par</Text>
                      <Text style={s.voucherMetaValue}>FoodGoodScan</Text>
                    </View>
                    <View style={s.voucherMetaRow}>
                      <Text style={s.voucherMetaLabel}>Réclamé le</Text>
                      <Text style={s.voucherMetaValue}>{claimedAt}</Text>
                    </View>
                    {expiresAt && (
                      <View style={s.voucherMetaRow}>
                        <Text style={s.voucherMetaLabel}>Valide jusqu'au</Text>
                        <Text style={[s.voucherMetaValue, { color: '#dc2626' }]}>{expiresAt}</Text>
                      </View>
                    )}
                    <View style={s.voucherMetaRow}>
                      <Text style={s.voucherMetaLabel}>Statut</Text>
                      <Text style={[s.voucherMetaValue, { color: isUsed ? '#999' : '#16a34a', fontWeight: '800' }]}>
                        {isUsed ? `Utilisé le ${new Date(uc.usedAt).toLocaleDateString('fr-CA')}` : '✓ Actif'}
                      </Text>
                    </View>
                  </View>

                  {/* Cachet UTILISÉ */}
                  {isUsed && (
                    <View style={s.usedStamp}>
                      <Text style={s.usedStampTxt}>UTILISÉ</Text>
                    </View>
                  )}
                </View>

                {/* Instructions selon le type */}
                {!isUsed && coupon.couponType === 'PROMO_CODE' && coupon.promoCode && (
                  <View style={s.voucherInstructions}>
                    <Text style={s.voucherInstructTitle}>Comment utiliser ce code promo</Text>
                    <Text style={s.voucherInstructStep}>① Copiez le code ci-dessous</Text>
                    <Text style={s.voucherInstructStep}>② Allez sur le site de {coupon.partner}</Text>
                    <Text style={s.voucherInstructStep}>③ Collez le code au moment du paiement</Text>
                    <TouchableOpacity
                      style={s.copyCodeBtn}
                      onPress={() => Alert.alert('Code copié !', `Collez le code "${coupon.promoCode}" sur le site de ${coupon.partner}.`)}
                    >
                      <Text style={s.copyCodeBtnTxt}>📋  Copier : {coupon.promoCode}</Text>
                    </TouchableOpacity>
                    <View style={s.disclaimerBox}>
                      <Text style={s.disclaimerTxt}>⚠️ Code public agrégé par FoodGoodScan. Non affilié à {coupon.partner}. Valide selon les conditions du marchand.</Text>
                    </View>
                  </View>
                )}

                {!isUsed && coupon.couponType === 'AFFILIATE' && coupon.affiliateUrl && (
                  <View style={s.voucherInstructions}>
                    <Text style={s.voucherInstructTitle}>Comment profiter du rabais</Text>
                    <Text style={s.voucherInstructStep}>① Appuyez sur le bouton ci-dessous</Text>
                    <Text style={s.voucherInstructStep}>② Le rabais s'applique automatiquement — aucun code à saisir</Text>
                    <TouchableOpacity style={s.copyCodeBtn} onPress={() => Linking.openURL(coupon.affiliateUrl)}>
                      <Text style={s.copyCodeBtnTxt}>🛒  Aller sur {coupon.partner}</Text>
                    </TouchableOpacity>
                    <View style={s.disclaimerBox}>
                      <Text style={s.disclaimerTxt}>FoodGoodScan peut recevoir une commission si vous achetez via ce lien, sans frais supplémentaires pour vous.</Text>
                    </View>
                  </View>
                )}

                {!isUsed && (!coupon.couponType || coupon.couponType === 'INTERNAL') && (
                  <View style={s.voucherInstructions}>
                    <Text style={s.voucherInstructTitle}>Récompense FoodGoodScan</Text>
                    <Text style={s.voucherInstructStep}>① Cette récompense est activée automatiquement sur votre compte</Text>
                    <Text style={s.voucherInstructStep}>② Aucune action requise en magasin</Text>
                    {coupon.terms ? <Text style={s.voucherInstructStep}>📋 {coupon.terms}</Text> : null}
                  </View>
                )}

                {/* Bouton marquer utilisé */}
                {!isUsed && (
                  <TouchableOpacity
                    style={[s.voucherUseBtn, marking && { opacity: 0.6 }]}
                    onPress={handleMarkUsed}
                    disabled={marking}
                  >
                    {marking
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.voucherUseBtnTxt}>✓  Marquer comme utilisé</Text>}
                  </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          );
        })()}
      </Modal>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#22c55e" />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Rabais & Coupons</Text>
            <Text style={s.headerSub}>📍 {postalCode || 'Code postal manquant'}</Text>
          </View>
          <TouchableOpacity style={s.pointsBadge} onPress={() => setTab('points')}>
            <Text style={s.pointsVal}>{points}</Text>
            <Text style={s.pointsLbl}>pts</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 4 }} style={s.tabScroll}>
          {([
            { key: 'local',  label: '📍 En magasin' },
            { key: 'saved',  label: `💾 Sauvegardés${savedDeals.length > 0 ? ` (${savedDeals.length})` : ''}` },
            { key: 'online', label: '🛒 En ligne' },
            { key: 'points', label: `⭐ Points${myCoupons.length > 0 ? ` · ${myCoupons.length}` : ''}` },
          ] as const).map(t => (
            <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[s.tabTxt, tab === t.key && s.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ══ En magasin ══════════════════════════════════════════════════════ */}
        {tab === 'local' && (
          <>
            <Text style={s.sectionTitle}>Circulaires de votre région</Text>
            <Text style={s.sectionSub}>IGA · Maxi · Metro · Walmart · Pharmaprix · Canadian Tire</Text>
            {localDeals.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>📭</Text>
                <Text style={s.emptyTxt}>Aucune offre trouvée.{'\n'}Tirez vers le bas pour actualiser.</Text>
              </View>
            ) : (
              <View style={s.grid}>
                {localDeals.map((deal, i) => {
                  const isSaved = savedDeals.some(d => d.id === deal.id);
                  return (
                    <View key={`${deal.id}-${i}`} style={s.dealCard}>
                      <View style={s.dealImgWrap}>
                        {deal.imageUrl
                          ? <DealImage uri={proxyImg(deal.imageUrl)} style={s.dealImg} />
                          : <Text style={s.dealFallbackEmoji}>{storeEmoji(deal.merchant)}</Text>
                        }
                        <TouchableOpacity
                          style={[s.saveBtn, isSaved && s.saveBtnOn]}
                          onPress={() => isSaved ? removeSaved(deal.id) : saveDeal(deal)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={s.saveBtnIco}>{isSaved ? '✓' : '+'}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={s.dealInfoBox}>
                        <Text style={s.dealName} numberOfLines={2}>{deal.name}</Text>
                        <Text style={s.dealMerchant}>{deal.merchant}</Text>
                        {(deal.saleStory || deal.priceText) && (
                          <Text style={s.dealPrice}>{deal.saleStory || deal.priceText}</Text>
                        )}
                        {deal.validUntil && (
                          <Text style={s.dealExpiry}>
                            Jusqu'au {new Date(deal.validUntil).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ══ Sauvegardés ══════════════════════════════════════════════════════ */}
        {tab === 'saved' && (
          savedDeals.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>💾</Text>
              <Text style={s.emptyTxt}>Aucune offre sauvegardée.{'\n\n'}Dans "En magasin", appuyez sur{'\n'}le bouton + pour sauvegarder.{'\n\n'}Vous pourrez l'afficher en plein écran au caissier.</Text>
            </View>
          ) : (
            <>
              <Text style={s.sectionTitle}>Vos offres sauvegardées</Text>
              <Text style={s.sectionSub}>Appuyez sur une carte pour l'afficher au caissier</Text>
              {savedDeals.map((deal, i) => (
                <TouchableOpacity key={`${deal.id}-${i}`} style={s.savedCard} onPress={() => setCashier(deal)} activeOpacity={0.8}>
                  <View style={s.savedImgWrap}>
                    {deal.imageUrl
                      ? <DealImage uri={proxyImg(deal.imageUrl)} style={s.savedImg} />
                      : <Text style={{ fontSize: 28 }}>{storeEmoji(deal.merchant)}</Text>
                    }
                  </View>
                  <View style={s.savedInfo}>
                    <Text style={s.savedName} numberOfLines={2}>{deal.name}</Text>
                    <Text style={s.savedMerchant}>{deal.merchant}</Text>
                    {(deal.saleStory || deal.priceText) && (
                      <Text style={s.savedPrice}>{deal.saleStory || deal.priceText}</Text>
                    )}
                  </View>
                  <View style={s.cashierPill}>
                    <Text style={s.cashierPillTxt}>📱 Afficher</Text>
                  </View>
                  <TouchableOpacity style={s.rmBtn} onPress={() => removeSaved(deal.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={s.rmBtnTxt}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )
        )}

        {/* ══ En ligne ════════════════════════════════════════════════════════ */}
        {tab === 'online' && (
          <>
            <Text style={s.sectionTitle}>Vrais rabais en ligne</Text>
            <Text style={s.sectionSub}>Pages officielles des commerçants — mis à jour par les magasins eux-mêmes</Text>
            {ONLINE_DEALS.map(deal => (
              <TouchableOpacity key={deal.id} style={s.onlineCard} onPress={() => openUrl(deal.url)} activeOpacity={0.8}>
                <Text style={s.onlineEmoji}>{deal.emoji}</Text>
                <View style={s.onlineInfoBox}>
                  <Text style={s.onlineStore}>{deal.store}</Text>
                  <Text style={s.onlineTitle}>{deal.title}</Text>
                  <Text style={s.onlineDesc} numberOfLines={2}>{deal.description}</Text>
                  <View style={[s.onlineBadge, { backgroundColor: deal.badgeColor + '22', borderColor: deal.badgeColor + '55' }]}>
                    <Text style={[s.onlineBadgeTxt, { color: deal.badgeColor }]}>{deal.badge}</Text>
                  </View>
                </View>
                <Text style={s.onlineArrow}>›</Text>
              </TouchableOpacity>
            ))}
            <Text style={s.onlineFooterTxt}>Ces liens ouvrent les pages officielles des commerçants.</Text>
          </>
        )}

        {/* ══ Points ══════════════════════════════════════════════════════════ */}
        {tab === 'points' && (
          <>
            <View style={s.earnBox}>
              <Text style={s.earnTitle}>Comment gagner des points</Text>
              <View style={s.earnRow}>
                <View style={s.earnItem}><Text style={s.earnEmoji}>📷</Text><Text style={s.earnPts}>+5</Text><Text style={s.earnLbl}>par scan</Text></View>
                <View style={s.earnItem}><Text style={s.earnEmoji}>🧠</Text><Text style={s.earnPts}>+3</Text><Text style={s.earnLbl}>par quiz</Text></View>
                <View style={s.earnItem}><Text style={s.earnEmoji}>📅</Text><Text style={s.earnPts}>+2</Text><Text style={s.earnLbl}>par jour</Text></View>
              </View>
              <View style={s.balanceRow}>
                <Text style={s.balanceLbl}>Solde actuel</Text>
                <Text style={s.balanceVal}>{points} points</Text>
              </View>
            </View>

            {pointCoupons.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Échanger mes points</Text>
                {pointCoupons.map(coupon => {
                  const claimed   = claimedIds.has(coupon.id);
                  const canAfford = points >= coupon.pointsCost;
                  return (
                    <View key={coupon.id} style={s.card}>
                      <View style={s.cardTop}>
                        <Text style={s.cardEmoji}>{coupon.imageEmoji}</Text>
                        <View style={s.cardInfoBox}>
                          <Text style={s.cardTitle}>{coupon.title}</Text>
                          <Text style={s.cardPartner}>{coupon.partner}</Text>
                          <Text style={s.cardDiscount}>{coupon.discount}</Text>
                        </View>
                        <View style={[s.cardCost, !canAfford && s.cardCostDim]}>
                          <Text style={[s.cardPts, !canAfford && s.cardPtsDim]}>{coupon.pointsCost}</Text>
                          <Text style={[s.cardPtsLbl, !canAfford && s.cardPtsDim]}>pts</Text>
                        </View>
                      </View>
                      {claimed ? (
                        <View style={s.claimedBadge}><Text style={s.claimedTxt}>✓ Réclamé</Text></View>
                      ) : (
                        <TouchableOpacity
                          style={[s.claimBtn, (!canAfford || !!claiming) && s.claimBtnOff]}
                          onPress={() => canAfford && !claiming && handleClaim(coupon)}
                          disabled={!canAfford || !!claiming}
                        >
                          {claiming === coupon.id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={s.claimBtnTxt}>{canAfford ? `Réclamer — ${coupon.pointsCost} pts` : `Manque ${coupon.pointsCost - points} pts`}</Text>}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {myCoupons.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 20 }]}>Mes coupons réclamés</Text>
                {myCoupons.map((uc: any) => (
                  <TouchableOpacity key={uc.id} style={[s.card, uc.usedAt && s.cardDim]} onPress={() => setSelected(uc)}>
                    <View style={s.cardTop}>
                      <Text style={s.cardEmoji}>{uc.coupon?.imageEmoji}</Text>
                      <View style={s.cardInfoBox}>
                        <Text style={s.cardTitle}>{uc.coupon?.title}</Text>
                        <Text style={s.cardPartner}>{uc.coupon?.partner}</Text>
                        <Text style={s.myCode}>{uc.code}</Text>
                      </View>
                      <Text style={uc.usedAt ? s.usedBadge : s.activeBadge}>{uc.usedAt ? 'Utilisé' : 'Actif'}</Text>
                    </View>
                    <Text style={s.tapHint}>Appuyer pour afficher le code</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a', gap: 14 },
  loadTxt:{ color: '#555', fontSize: 14 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 28 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub:   { color: '#22c55e', fontSize: 12, marginTop: 2 },
  pointsBadge: { backgroundColor: '#22c55e', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  pointsVal:   { color: '#fff', fontSize: 20, fontWeight: '900' },
  pointsLbl:   { color: 'rgba(255,255,255,0.8)', fontSize: 10 },

  tabScroll: { flexGrow: 0, marginBottom: 14 },
  tab:       { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 },
  tabActive: { backgroundColor: '#22c55e' },
  tabTxt:    { color: '#666', fontWeight: '600', fontSize: 13 },
  tabTxtActive: { color: '#fff' },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 4 },
  sectionSub:   { color: '#444', fontSize: 11, marginHorizontal: 16, marginBottom: 12 },

  // En magasin grid
  grid:          { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  dealCard:      { width: '48%', margin: '1%', backgroundColor: '#141414', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 10 },
  dealImgWrap:   { position: 'relative' },
  dealImg:       { width: '100%', height: 100, backgroundColor: '#fff' },
  dealFallbackEmoji: { width: '100%', height: 100, textAlign: 'center', fontSize: 36, backgroundColor: '#111', lineHeight: 100 },
  saveBtn:       { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff22' },
  saveBtnOn:     { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  saveBtnIco:    { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 19 },
  dealInfoBox:   { padding: 8 },
  dealName:      { color: '#e5e5e5', fontSize: 11, fontWeight: '600', marginBottom: 3, lineHeight: 15 },
  dealMerchant:  { color: '#555', fontSize: 10, marginBottom: 3 },
  dealPrice:     { color: '#22c55e', fontSize: 13, fontWeight: '800' },
  dealExpiry:    { color: '#333', fontSize: 10, marginTop: 2 },

  // Sauvegardés
  savedCard:    { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#141414', borderRadius: 16, borderWidth: 1, borderColor: '#1e1e1e', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  savedImgWrap: { width: 82, height: 82, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  savedImg:     { width: 82, height: 82, backgroundColor: '#fff' },
  savedInfo:    { flex: 1, padding: 12, paddingRight: 32 },
  savedName:    { color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 17, marginBottom: 3 },
  savedMerchant:{ color: '#555', fontSize: 11 },
  savedPrice:   { color: '#22c55e', fontSize: 14, fontWeight: '800', marginTop: 4 },
  cashierPill:  { marginRight: 8, backgroundColor: '#22c55e18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  cashierPillTxt: { color: '#22c55e', fontSize: 11, fontWeight: '700' },
  rmBtn:        { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  rmBtnTxt:     { color: '#666', fontSize: 11 },

  // En ligne
  onlineCard:    { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#141414', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e1e1e', flexDirection: 'row', alignItems: 'center' },
  onlineEmoji:   { fontSize: 30, marginRight: 14, width: 38, textAlign: 'center' },
  onlineInfoBox: { flex: 1 },
  onlineStore:   { color: '#666', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  onlineTitle:   { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  onlineDesc:    { color: '#555', fontSize: 12, lineHeight: 17, marginBottom: 8 },
  onlineBadge:   { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  onlineBadgeTxt:{ fontSize: 10, fontWeight: '700' },
  onlineArrow:   { color: '#444', fontSize: 24, marginLeft: 10 },
  onlineFooterTxt:{ color: '#2a2a2a', fontSize: 11, textAlign: 'center', marginHorizontal: 16, marginTop: 4, marginBottom: 8 },

  // Points
  earnBox:    { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#141414', borderRadius: 16, padding: 16 },
  earnTitle:  { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  earnRow:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  earnItem:   { alignItems: 'center', gap: 2 },
  earnEmoji:  { fontSize: 26 },
  earnPts:    { color: '#22c55e', fontSize: 18, fontWeight: '900' },
  earnLbl:    { color: '#555', fontSize: 11 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, padding: 12 },
  balanceLbl: { color: '#888', fontSize: 13 },
  balanceVal: { color: '#22c55e', fontSize: 20, fontWeight: '900' },

  card:      { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#141414', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1e1e1e' },
  cardDim:   { opacity: 0.4 },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardEmoji: { fontSize: 28, marginRight: 10 },
  cardInfoBox:{ flex: 1 },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardPartner:{ color: '#666', fontSize: 11, marginTop: 2 },
  cardDiscount: { color: '#22c55e', fontSize: 13, fontWeight: '700', marginTop: 4 },
  cardCost:  { backgroundColor: '#22c55e20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  cardCostDim: { backgroundColor: '#1a1a1a' },
  cardPts:   { color: '#22c55e', fontSize: 16, fontWeight: '900' },
  cardPtsDim:{ color: '#444' },
  cardPtsLbl:{ color: '#22c55e', fontSize: 10 },
  claimBtn:  { backgroundColor: '#22c55e', borderRadius: 10, padding: 11, alignItems: 'center' },
  claimBtnOff:{ backgroundColor: '#1a1a1a' },
  claimBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  claimedBadge:{ backgroundColor: '#14532d', borderRadius: 10, padding: 10, alignItems: 'center' },
  claimedTxt:{ color: '#86efac', fontSize: 12, fontWeight: '600' },
  myCode:    { color: '#22c55e', fontSize: 12, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  activeBadge:{ color: '#22c55e', fontSize: 11, backgroundColor: '#22c55e15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  usedBadge: { color: '#444', fontSize: 11, backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tapHint:   { color: '#333', fontSize: 11 },

  empty:     { alignItems: 'center', padding: 50 },
  emptyEmoji:{ fontSize: 52, marginBottom: 14 },
  emptyTxt:  { color: '#444', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Modal coupon
  // ── Bon de réduction plein écran ──────────────────────────────────────────
  voucherRoot:  { flex: 1, backgroundColor: '#f5f5f5' },
  voucherClose: { backgroundColor: '#111', paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  voucherCloseTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  voucherScroll: { padding: 16, paddingTop: 10 },

  voucher: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  voucherUsed: { opacity: 0.6 },

  voucherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#eee' },
  voucherHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  voucherEmoji: { fontSize: 36 },
  voucherPartner: { color: '#111', fontSize: 18, fontWeight: '900' },
  voucherCategory: { color: '#888', fontSize: 12, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  voucherDiscountBadge: { backgroundColor: '#dc2626', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', minWidth: 80 },
  voucherDiscount: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },

  voucherDivider: { height: 1, backgroundColor: '#eee', marginHorizontal: 16, borderStyle: 'dashed' },

  voucherTitle: { color: '#111', fontSize: 16, fontWeight: '800', marginHorizontal: 18, marginTop: 14, lineHeight: 22 },
  voucherDesc:  { color: '#555', fontSize: 13, marginHorizontal: 18, marginTop: 6, marginBottom: 14, lineHeight: 19 },

  voucherBarcodeWrap: { alignItems: 'center', paddingVertical: 20, backgroundColor: '#fff' },
  voucherBarcode: { flexDirection: 'row', alignItems: 'flex-end', gap: 1.5, height: 56, marginBottom: 10 },
  voucherCode: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 4, fontFamily: 'monospace' },
  voucherCodeSub: { fontSize: 11, color: '#aaa', marginTop: 4 },

  voucherMeta: { padding: 16, gap: 8, backgroundColor: '#fafafa', borderTopWidth: 1, borderTopColor: '#eee' },
  voucherMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voucherMetaLabel: { color: '#999', fontSize: 12, fontWeight: '600' },
  voucherMetaValue: { color: '#333', fontSize: 13, fontWeight: '700' },

  usedStamp: {
    position: 'absolute', top: '40%', left: '10%', right: '10%',
    borderWidth: 4, borderColor: '#dc2626', borderRadius: 8,
    padding: 8, alignItems: 'center', transform: [{ rotate: '-12deg' }],
  },
  usedStampTxt: { color: '#dc2626', fontSize: 32, fontWeight: '900', letterSpacing: 6 },

  voucherInstructions: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#fde68a' },
  voucherInstructTitle: { color: '#92400e', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  voucherInstructStep: { color: '#78350f', fontSize: 13, lineHeight: 22 },
  copyCodeBtn: { backgroundColor: '#1d4ed8', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  copyCodeBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disclaimerBox: { marginTop: 10, padding: 10, backgroundColor: '#fef9c3', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#ca8a04' },
  disclaimerTxt: { color: '#713f12', fontSize: 11, lineHeight: 16 },

  voucherUseBtn: { backgroundColor: '#16a34a', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 14, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  voucherUseBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Caissier plein écran
  cashierRoot:   { flex: 1, backgroundColor: '#000' },
  cashierCloseBtn:{ padding: 20, paddingTop: 50 },
  cashierCloseTxt:{ color: '#fff', fontSize: 16, fontWeight: '600' },
  cashierContent:{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  cashierImg:    { width: SW - 48, height: SH * 0.35, backgroundColor: '#fff', borderRadius: 16, marginBottom: 24 },
  cashierName:   { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  cashierMerchant:{ color: '#888', fontSize: 15, marginBottom: 16 },
  cashierPriceBox:{ backgroundColor: '#22c55e', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14, marginBottom: 16 },
  cashierPrice:  { color: '#fff', fontSize: 28, fontWeight: '900' },
  cashierExpiry: { color: '#555', fontSize: 13, marginBottom: 24 },
  cashierHint:   { color: '#444', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  removeSavedBtn:{ backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  removeSavedTxt:{ color: '#555', fontSize: 13 },
});
