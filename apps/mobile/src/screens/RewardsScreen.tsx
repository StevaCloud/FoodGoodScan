import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, RefreshControl, Image,
  Platform, Linking, Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Barcode from 'react-native-barcode-svg';
import { getCoupons, getMyCoupons, claimCoupon, getLocalDeals, getEuropeanDeals, getRealCoupons, unlockRssCoupon } from '../services/api';
import { useStore } from '../store/useStore';
import { useUserCountry } from '../hooks/useUserCountry';
import { isEuropean, isUS, getCountryFlag, getCountryLabel } from '../utils/countryDetection';

const { width: SW, height: SH } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

type Tab = 'local' | 'saved' | 'promos' | 'online' | 'points';

// ── Deals en ligne curatés — Canada ───────────────────────────────────────────
const ONLINE_DEALS_CA = [
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

const ONLINE_DEALS_US = [
  { id: 'amazon-us', store: 'Amazon.com', emoji: '📦', title: "Today's Deals", description: 'Lightning deals and daily offers up to -70%', badge: 'Updated hourly', url: 'https://www.amazon.com/deals', badgeColor: '#FF9900' },
  { id: 'walmart-us', store: 'Walmart US', emoji: '🏪', title: 'Rollbacks & Clearance', description: 'Everyday low prices on grocery, electronics, home', badge: 'Rollback', url: 'https://www.walmart.com/store/507/weekly-ad', badgeColor: '#0071CE' },
  { id: 'kroger', store: 'Kroger', emoji: '🛒', title: 'Weekly Ad', description: "This week's deals on food, pharmacy and more", badge: 'Grocery', url: 'https://www.kroger.com/weeklyad', badgeColor: '#E41B2D' },
  { id: 'target', store: 'Target', emoji: '🎯', title: 'Weekly Ad', description: 'Food, household, electronics — Circle deals', badge: 'Circle Deals', url: 'https://www.target.com/store-locator/find-stores', badgeColor: '#CC0000' },
  { id: 'costco', store: 'Costco', emoji: '🏭', title: 'Online-Only Offers', description: 'Bulk savings on grocery, home, electronics', badge: 'Members', url: 'https://www.costco.com/online-only-offers.html', badgeColor: '#0B559C' },
];

const ONLINE_DEALS_EU: Record<string, typeof ONLINE_DEALS_CA> = {
  FR: [
    { id: 'lidl-fr',   store: 'Lidl France',    emoji: '🏷️', title: 'Promos Lidl',          description: 'Offres alimentaires et non-alimentaires de la semaine', badge: 'Alimentaire', url: 'https://www.lidl.fr/promotions', badgeColor: '#F7D000' },
    { id: 'carref-fr', store: 'Carrefour',       emoji: '🛒', title: 'Promo de la semaine',  description: 'Prospectus Carrefour : épicerie, frais, surgélés', badge: 'Supermarché', url: 'https://www.carrefour.fr/service/promotions', badgeColor: '#004C97' },
    { id: 'aldi-fr',   store: 'Aldi France',     emoji: '💰', title: 'Offres Aldi',           description: "Découvertes de la semaine et produits du moment", badge: 'Discount', url: 'https://www.aldi.fr/offres-de-la-semaine.html', badgeColor: '#003FA0' },
    { id: 'leclerc',   store: 'E.Leclerc',       emoji: '🏬', title: 'Catalogue Leclerc',    description: 'Prix bas en drive, épicerie, frais, hygiène', badge: 'Drive', url: 'https://www.e.leclerc/catalogue', badgeColor: '#005BB1' },
    { id: 'inter',     store: 'Intermarché',     emoji: '🌿', title: 'Promotions',            description: 'Viandes, fruits & légumes, épicerie en promo', badge: 'Épicerie', url: 'https://www.intermarche.com/offres-promotionnelles', badgeColor: '#E60012' },
  ],
  DE: [
    { id: 'lidl-de',  store: 'Lidl Deutschland', emoji: '🏷️', title: 'Aktuelle Angebote',  description: 'Wochenangebote für Lebensmittel und Haushalt', badge: 'Lebensmittel', url: 'https://www.lidl.de/aktuelle-angebote', badgeColor: '#F7D000' },
    { id: 'aldi-de',  store: 'Aldi Süd',         emoji: '💰', title: 'Angebote der Woche',  description: 'Sonderangebote auf Lebensmittel und Aktionsware', badge: 'Discount', url: 'https://www.aldi-sued.de/de/angebote.html', badgeColor: '#003FA0' },
    { id: 'rewe',     store: 'Rewe',              emoji: '🛒', title: 'Wochenangebote',      description: 'Frisches, Tiefkühl, Getränke und mehr im Angebot', badge: 'Supermarkt', url: 'https://www.rewe.de/angebote/', badgeColor: '#CC0000' },
    { id: 'edeka',    store: 'Edeka',             emoji: '🏬', title: 'Prospekte & Angebote',description: 'Regionale Angebote bei Edeka und Netto', badge: 'Regional', url: 'https://www.edeka.de/angebote/', badgeColor: '#FFD700' },
  ],
  UK: [
    { id: 'lidl-uk',  store: 'Lidl UK',    emoji: '🏷️', title: 'Weekly Offers',       description: 'Fresh food and household deals this week', badge: 'Grocery', url: 'https://www.lidl.co.uk/offers', badgeColor: '#F7D000' },
    { id: 'aldi-uk',  store: 'Aldi UK',    emoji: '💰', title: 'Super 6 & Specialbuys',description: 'Incredible prices every week at Aldi', badge: 'Discount', url: 'https://www.aldi.co.uk/offers', badgeColor: '#003FA0' },
    { id: 'tesco',    store: 'Tesco',      emoji: '🛒', title: 'Clubcard Prices',      description: 'Extra savings with Clubcard — food and drinks', badge: 'Clubcard', url: 'https://www.tesco.com/groceries/en-GB/promotions', badgeColor: '#E71B2D' },
    { id: 'sainsb',   store: "Sainsbury's",emoji: '🏬', title: 'Nectar Prices',        description: 'Better prices with Nectar at Sainsbury\'s', badge: 'Nectar', url: 'https://www.sainsburys.co.uk/gol-ui/promotions', badgeColor: '#FF7B00' },
  ],
  BE: [
    { id: 'lidl-be',  store: 'Lidl Belgique', emoji: '🏷️', title: 'Promotions',         description: 'Promoties op voeding, dranken en meer', badge: 'Alimentaire', url: 'https://www.lidl.be/promotions', badgeColor: '#F7D000' },
    { id: 'delhaize', store: 'Delhaize',      emoji: '🛒', title: 'Promos Delhaize',     description: 'Folder de la semaine, épicerie et frais', badge: 'Supermarché', url: 'https://www.delhaize.be/fr-be/folder', badgeColor: '#E4002B' },
    { id: 'colruyt',  store: 'Colruyt',       emoji: '💰', title: 'Prix et promotions',  description: 'Prijzen van de week bij Colruyt', badge: 'Prix bas', url: 'https://www.colruyt.be/fr/folder-semaine', badgeColor: '#E30613' },
    { id: 'albert',   store: 'Albert Heijn',  emoji: '🏬', title: 'Aanbiedingen',        description: 'Bonus kaart prijzen op groenten, vlees, etc.', badge: 'Bonuskaart', url: 'https://www.ah.be/promoties', badgeColor: '#009AC7' },
  ],
};

function getOnlineDeals(country: string, isEu: boolean, isAmerica: boolean) {
  if (!isEu && !isAmerica) return ONLINE_DEALS_CA;
  if (isAmerica) return ONLINE_DEALS_US;
  return ONLINE_DEALS_EU[country] || ONLINE_DEALS_EU.FR;
}

const ONLINE_DEALS = ONLINE_DEALS_CA;

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
  const { country } = useUserCountry();
  const userIsEu = isEuropean(country);
  const userIsUS = isUS(country);
  const activeOnlineDeals = getOnlineDeals(country, userIsEu, userIsUS);

  const [localDeals,    setLocalDeals]    = useState<any[]>([]);
  const [pointCoupons,  setPointCoupons]  = useState<any[]>([]);
  const [myCoupons,     setMyCoupons]     = useState<any[]>([]);
  const [points,        setPoints]        = useState(0);
  const [realCoupons,   setRealCoupons]   = useState<any[]>([]);
  const [promoSelected, setPromoSelected] = useState<any | null>(null);
  const [unlocking,     setUnlocking]     = useState<string | null>(null);

  const RSS_COST = 30;

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
      const localPromise = userIsEu ? getEuropeanDeals(country) : getLocalDeals(pc);
      const [local, all, my, real] = await Promise.all([
        localPromise,
        getCoupons(),
        getMyCoupons(),
        getRealCoupons().catch(() => []),
      ]);
      setLocalDeals(local);
      setPointCoupons(all);
      setMyCoupons(my.coupons);
      setPoints(my.points);
      setRealCoupons(Array.isArray(real) ? real : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [postalCode, country, userIsEu]);

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

                  {/* Code-barres scannable à la caisse */}
                  <View style={[s.voucherBarcodeWrap, isUsed && { opacity: 0.4 }]}>
                    <View style={s.voucherBarcodeSvgWrap}>
                      <Barcode value={uc.code} format="CODE128" singleBarWidth={2} height={80} lineColor="#111" backgroundColor="#fff" />
                    </View>
                    <Text style={s.voucherCodeBig}>{uc.code}</Text>
                    <TouchableOpacity style={s.voucherCopyBtn} onPress={() => { Clipboard.setStringAsync(uc.code); Alert.alert('Copié !', 'Code copié.'); }}>
                      <Text style={s.voucherCopyBtnTxt}>📋 Copier</Text>
                    </TouchableOpacity>
                    <Text style={s.voucherCodeSub}>Scannez le code-barres à la caisse</Text>
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
            { key: 'promos', label: `🏷️ Promos${realCoupons.length > 0 ? ` (${realCoupons.length})` : ''}` },
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
            <Text style={s.sectionTitle}>
              {userIsEu ? `Circulaires — ${getCountryFlag(country)} ${getCountryLabel(country)}` : userIsUS ? 'Weekly Flyers — 🇺🇸' : 'Circulaires de votre région'}
            </Text>
            <Text style={s.sectionSub}>
              {userIsEu ? 'Lidl · et autres grandes enseignes' : userIsUS ? 'Kroger · Walmart · Target · Costco' : 'IGA · Maxi · Metro · Walmart · Pharmaprix · Canadian Tire'}
            </Text>
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

        {/* ══ Vrais Promos (RSS) ══════════════════════════════════════════════ */}
        {tab === 'promos' && (
          <>
            {/* Bandeau solde points */}
            <View style={s.promoPointsBanner}>
              <Text style={s.promoPointsBannerTxt}>Votre solde : </Text>
              <Text style={s.promoPointsBannerVal}>{points} pts</Text>
              <Text style={s.promoPointsBannerSub}> — Faites des quiz pour en gagner !</Text>
            </View>

            <Text style={s.sectionTitle}>Vrais codes promo</Text>
            <Text style={s.sectionSub}>Débloque chaque code avec {RSS_COST} pts · RedFlagDeals · Smartcanucks · Reducteur</Text>

            {/* Modal coupon débloqué */}
            <Modal visible={!!promoSelected} transparent={false} animationType="slide" onRequestClose={() => setPromoSelected(null)}>
              {promoSelected && (() => {
                const isUnlocked = !!myCoupons.find((uc: any) => uc.coupon?.promoCode === promoSelected.code);
                return (
                  <View style={s.promoModalRoot}>
                    <TouchableOpacity style={s.promoModalClose} onPress={() => setPromoSelected(null)}>
                      <Text style={s.promoModalCloseTxt}>✕  Fermer</Text>
                    </TouchableOpacity>
                    <ScrollView contentContainerStyle={s.promoModalScroll}>
                      <View style={s.promoDetailCard}>
                        <View style={s.promoDetailHeader}>
                          <Text style={s.promoDetailEmoji}>{promoSelected.imageEmoji || '🏷️'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={s.promoDetailStore}>{promoSelected.store}</Text>
                            <Text style={s.promoDetailTitle}>{promoSelected.title}</Text>
                          </View>
                          <View style={s.promoDetailBadge}>
                            <Text style={s.promoDetailDiscount}>{promoSelected.discount}</Text>
                          </View>
                        </View>
                        {promoSelected.description ? (
                          <Text style={s.promoDetailDesc}>{promoSelected.description}</Text>
                        ) : null}

                        {promoSelected.code ? (
                          isUnlocked ? (
                            <View style={s.promoCodeSection}>
                              <Text style={s.promoCodeLabel}>✓ Code débloqué</Text>
                              <View style={s.promoCodeBox}>
                                <Text style={s.promoCodeText}>{promoSelected.code}</Text>
                                <TouchableOpacity
                                  style={s.promoCopyBtn}
                                  onPress={async () => {
                                    await Clipboard.setStringAsync(promoSelected.code);
                                    Alert.alert('Copié !', `Code "${promoSelected.code}" copié.`);
                                  }}
                                >
                                  <Text style={s.promoCopyBtnTxt}>📋 Copier</Text>
                                </TouchableOpacity>
                              </View>
                              <View style={s.promoQRWrap}>
                                <View style={s.voucherBarcodeSvgWrap}>
                                  <Barcode value={promoSelected.code} format="CODE128" singleBarWidth={2} height={80} lineColor="#111" backgroundColor="#fff" />
                                </View>
                                <Text style={s.voucherCodeBig}>{promoSelected.code}</Text>
                                <TouchableOpacity style={s.voucherCopyBtn} onPress={() => { Clipboard.setStringAsync(promoSelected.code); Alert.alert('Copié !', 'Code copié.'); }}>
                                  <Text style={s.voucherCopyBtnTxt}>📋 Copier le code</Text>
                                </TouchableOpacity>
                                <Text style={s.promoQRSub}>Scannez le code-barres à la caisse ou entrez-le en ligne</Text>
                              </View>
                            </View>
                          ) : (
                            <View style={s.promoLockSection}>
                              <Text style={s.promoLockEmoji}>🔒</Text>
                              <Text style={s.promoLockTitle}>Code verrouillé</Text>
                              <Text style={s.promoLockSub}>Débloquez ce code promo avec vos points gagnés lors des quiz</Text>
                              <TouchableOpacity
                                style={[s.promoUnlockBtn, (points < RSS_COST || unlocking === promoSelected.id) && s.promoUnlockBtnOff]}
                                disabled={points < RSS_COST || !!unlocking}
                                onPress={async () => {
                                  if (points < RSS_COST) {
                                    Alert.alert('Points insuffisants', `Il vous faut ${RSS_COST} pts. Faites des quiz pour en gagner !`);
                                    return;
                                  }
                                  setUnlocking(promoSelected.id);
                                  try {
                                    await unlockRssCoupon({
                                      rssId: promoSelected.id,
                                      title: promoSelected.title,
                                      store: promoSelected.store,
                                      code: promoSelected.code,
                                      discount: promoSelected.discount,
                                      url: promoSelected.url,
                                      source: promoSelected.source,
                                      imageEmoji: promoSelected.imageEmoji,
                                      description: promoSelected.description,
                                      category: promoSelected.category,
                                    });
                                    await load();
                                    Alert.alert('Code débloqué !', `Votre code "${promoSelected.code}" est maintenant disponible.`);
                                  } catch (e: any) {
                                    Alert.alert('Erreur', e.response?.data?.error || 'Impossible de débloquer');
                                  }
                                  setUnlocking(null);
                                }}
                              >
                                {unlocking === promoSelected.id
                                  ? <ActivityIndicator color="#fff" size="small" />
                                  : <Text style={s.promoUnlockBtnTxt}>
                                      {points >= RSS_COST ? `🔓 Débloquer — ${RSS_COST} pts` : `Manque ${RSS_COST - points} pts`}
                                    </Text>
                                }
                              </TouchableOpacity>
                            </View>
                          )
                        ) : (
                          <View style={s.promoNoCodBox}>
                            <Text style={s.promoNoCodTxt}>Aucun code requis — le rabais s'applique automatiquement</Text>
                          </View>
                        )}

                        <View style={s.promoSourceRow}>
                          <Text style={s.promoSourceTxt}>Source : {promoSelected.source}</Text>
                          {promoSelected.postedAt ? (
                            <Text style={s.promoSourceTxt}>
                              Publié le {new Date(promoSelected.postedAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {promoSelected.url ? (
                        <TouchableOpacity style={s.promoLinkBtn} onPress={() => Linking.openURL(promoSelected.url)}>
                          <Text style={s.promoLinkBtnTxt}>🔗  Voir le deal complet</Text>
                        </TouchableOpacity>
                      ) : null}
                      <View style={{ height: 40 }} />
                    </ScrollView>
                  </View>
                );
              })()}
            </Modal>

            {realCoupons.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>🏷️</Text>
                <Text style={s.emptyTxt}>Aucun coupon disponible.{'\n'}Tirez vers le bas pour actualiser.</Text>
              </View>
            ) : (
              realCoupons.map(coupon => {
                const isUnlocked = !!myCoupons.find((uc: any) => uc.coupon?.promoCode === coupon.code);
                const hasCode = !!coupon.code;
                return (
                  <TouchableOpacity key={coupon.id} style={s.promoCouponCard} onPress={() => setPromoSelected(coupon)} activeOpacity={0.8}>
                    <View style={s.promoCouponTop}>
                      <Text style={s.promoCouponEmoji}>{coupon.imageEmoji || '🏷️'}</Text>
                      <View style={s.promoCouponInfo}>
                        <Text style={s.promoCouponStore}>{coupon.store}</Text>
                        <Text style={s.promoCouponTitle} numberOfLines={2}>{coupon.title}</Text>
                      </View>
                      <View style={s.promoCouponBadge}>
                        <Text style={s.promoCouponDiscount}>{coupon.discount}</Text>
                      </View>
                    </View>
                    {hasCode ? (
                      isUnlocked ? (
                        <View style={s.promoCouponCodeRow}>
                          <Text style={s.promoCouponCode}>{coupon.code}</Text>
                          <TouchableOpacity
                            style={s.promoCouponCopyBtn}
                            onPress={async (e) => {
                              e.stopPropagation?.();
                              await Clipboard.setStringAsync(coupon.code);
                              Alert.alert('Copié !', `Code "${coupon.code}" copié.`);
                            }}
                          >
                            <Text style={s.promoCouponCopyTxt}>📋</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={s.promoCouponLockedRow}>
                          <Text style={s.promoCouponLocked}>🔒 ••••••••</Text>
                          <View style={s.promoCouponCostBadge}>
                            <Text style={s.promoCouponCostTxt}>{RSS_COST} pts</Text>
                          </View>
                        </View>
                      )
                    ) : (
                      <Text style={s.promoCouponNoCode}>Appuyer pour voir le deal →</Text>
                    )}
                    <Text style={s.promoCouponSource}>{coupon.source}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* ══ En ligne ════════════════════════════════════════════════════════ */}
        {tab === 'online' && (
          <>
            <Text style={s.sectionTitle}>
              {userIsEu ? `Rabais en ligne — ${getCountryFlag(country)} ${getCountryLabel(country)}` : 'Vrais rabais en ligne'}
            </Text>
            <Text style={s.sectionSub}>Pages officielles des commerçants — mis à jour par les magasins eux-mêmes</Text>
            {activeOnlineDeals.map(deal => (
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
  voucherQRWrap: { padding: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  voucherBarcodeSvgWrap: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  voucherCodeBox: { backgroundColor: '#f4f4f4', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 18, marginBottom: 14, borderWidth: 2, borderColor: '#22c55e', borderStyle: 'dashed' },
  voucherCodeBig: { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: 4, fontFamily: 'monospace', textAlign: 'center', marginBottom: 10 },
  voucherCopyBtn: { backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10, marginBottom: 10 },
  voucherCopyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  voucherCode: { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: 4, fontFamily: 'monospace' },
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

  // ── Vrais promos RSS ────────────────────────────────────────────────────────
  promoCouponCard:    { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#141414', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1e1e1e' },
  promoCouponTop:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  promoCouponEmoji:   { fontSize: 26, marginRight: 10, width: 32 },
  promoCouponInfo:    { flex: 1 },
  promoCouponStore:   { color: '#666', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  promoCouponTitle:   { color: '#e5e5e5', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  promoCouponBadge:   { backgroundColor: '#22c55e20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  promoCouponDiscount:{ color: '#22c55e', fontSize: 12, fontWeight: '800' },
  promoCouponCodeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', borderRadius: 10, padding: 10, marginBottom: 6 },
  promoCouponCode:    { flex: 1, color: '#22c55e', fontSize: 16, fontWeight: '900', letterSpacing: 2, fontFamily: 'monospace' },
  promoCouponCopyBtn: { backgroundColor: '#22c55e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  promoCouponCopyTxt: { fontSize: 16 },
  promoCouponNoCode:  { color: '#444', fontSize: 12, marginBottom: 6 },
  promoCouponSource:  { color: '#333', fontSize: 11 },
  promoCouponLockedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', borderRadius: 10, padding: 10, marginBottom: 6 },
  promoCouponLocked:  { flex: 1, color: '#555', fontSize: 16, letterSpacing: 3 },
  promoCouponCostBadge: { backgroundColor: '#1a1a1a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#333' },
  promoCouponCostTxt: { color: '#f59e0b', fontSize: 12, fontWeight: '800' },

  promoPointsBanner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2d13', borderRadius: 12, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 10 },
  promoPointsBannerTxt: { color: '#888', fontSize: 13 },
  promoPointsBannerVal: { color: '#22c55e', fontSize: 16, fontWeight: '900' },
  promoPointsBannerSub: { color: '#555', fontSize: 12 },

  // Lock / Unlock section
  promoLockSection:   { backgroundColor: '#0f0f0f', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#1e1e1e' },
  promoLockEmoji:     { fontSize: 40, marginBottom: 8 },
  promoLockTitle:     { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  promoLockSub:       { color: '#666', fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  promoUnlockBtn:     { backgroundColor: '#22c55e', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', minWidth: 200 },
  promoUnlockBtnOff:  { backgroundColor: '#1a1a1a' },
  promoUnlockBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Modal promo
  promoModalRoot:     { flex: 1, backgroundColor: '#f5f5f5' },
  promoModalClose:    { backgroundColor: '#111', paddingVertical: 14, paddingHorizontal: 20 },
  promoModalCloseTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  promoModalScroll:   { padding: 16 },
  promoDetailCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  promoDetailHeader:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  promoDetailEmoji:   { fontSize: 36 },
  promoDetailStore:   { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  promoDetailTitle:   { color: '#111', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  promoDetailBadge:   { backgroundColor: '#16a34a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  promoDetailDiscount:{ color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  promoDetailDesc:    { color: '#555', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  promoCodeSection:   { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#bbf7d0' },
  promoCodeLabel:     { color: '#166534', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  promoCodeBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#bbf7d0' },
  promoCodeText:      { flex: 1, color: '#166534', fontSize: 22, fontWeight: '900', letterSpacing: 3, fontFamily: 'monospace' },
  promoCopyBtn:       { backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  promoCopyBtnTxt:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  promoQRWrap:        { alignItems: 'center', paddingVertical: 12 },
  promoQRSub:         { color: '#888', fontSize: 12, marginTop: 10 },
  promoNoCodBox:      { backgroundColor: '#fefce8', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#fde68a' },
  promoNoCodTxt:      { color: '#92400e', fontSize: 13 },
  promoSourceRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  promoSourceTxt:     { color: '#aaa', fontSize: 11 },
  promoLinkBtn:       { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 14 },
  promoLinkBtnTxt:    { color: '#fff', fontSize: 15, fontWeight: '800' },
});
