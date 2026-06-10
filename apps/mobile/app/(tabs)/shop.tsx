import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { useAuth, buildShopifyUrl } from '@lunari/utils'
import { getPhaseForDay } from '@lunari/phase-data'
import { LoadingSpinner } from '@lunari/ui'
import type { TodayCycleResponse, UserReferralCode } from '@lunari/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1'
const KIT_URL =
  process.env.EXPO_PUBLIC_SHOPIFY_PRODUCT_KIT_URL ??
  'https://herlunari.myshopify.com/products/30-day-kit'
const SUB_URL =
  process.env.EXPO_PUBLIC_SHOPIFY_PRODUCT_SUB_URL ??
  'https://herlunari.myshopify.com/products/monthly-subscription'

export default function Shop() {
  const { session } = useAuth()
  const [cycleData, setCycleData] = useState<TodayCycleResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Referral state
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' }),
    [session]
  )

  const fetchData = useCallback(async () => {
    if (!session) return
    try {
      const [cycleRes, refRes] = await Promise.all([
        fetch(`${API_URL}/me/cycle/today`, { headers: authHeaders() }),
        fetch(`${API_URL}/me/referral-code`, { headers: authHeaders() }),
      ])
      if (cycleRes.ok) setCycleData(await cycleRes.json())
      if (refRes.ok) {
        const ref: UserReferralCode = await refRes.json()
        setSavedCode(ref.code ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [session, authHeaders])

  useEffect(() => { fetchData() }, [fetchData])

  const openShopify = async (baseUrl: string) => {
    await WebBrowser.openBrowserAsync(buildShopifyUrl(baseUrl, savedCode))
  }

  const applyCode = async () => {
    const code = codeInput.trim()
    if (!code) return
    setApplying(true)
    setFeedback(null)
    try {
      const res = await fetch(`${API_URL}/me/referral-code`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        setFeedback({ type: 'error', msg: "That code wasn't found." })
        return
      }
      const data = await res.json()
      setSavedCode(data.code)
      setEditing(false)
      setCodeInput('')
      setFeedback({
        type: 'success',
        msg: `Code ${data.code} applied — 10% discount added at checkout`,
      })
    } catch {
      setFeedback({ type: 'error', msg: "That code wasn't found." })
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const phase = cycleData ? getPhaseForDay(cycleData.day) : getPhaseForDay(1)
  const lowStock = (cycleData?.daysRemainingInPhase ?? 99) <= 3

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>lunari shop</Text>

        {/* Current container callout */}
        <View
          style={[
            styles.calloutCard,
            { backgroundColor: phase.lightColor, borderLeftColor: phase.color },
          ]}
        >
          <Text style={styles.calloutHeading}>
            You&apos;re on your {phase.name} container
          </Text>
          <Text style={styles.calloutSub}>
            {lowStock
              ? 'Running low? Reorder before your cycle ends.'
              : `Container ${cycleData?.containerNumber ?? 1} of 4 · ${cycleData?.daysRemainingInPhase ?? 0} days left`}
          </Text>
          <TouchableOpacity
            style={[styles.calloutCta, { backgroundColor: phase.color }]}
            onPress={() => openShopify(KIT_URL)}
            activeOpacity={0.85}
          >
            <Text style={styles.calloutCtaText}>Shop now →</Text>
          </TouchableOpacity>
        </View>

        {/* Products */}
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>30-Day Kit</Text>
            <Text style={styles.productPrice}>$75</Text>
          </View>
          <Text style={styles.productDesc}>One box. Four phases. Thirty days.</Text>
          <Text style={styles.productSubtext}>One-time purchase</Text>
          <TouchableOpacity
            style={styles.productCta}
            onPress={() => openShopify(KIT_URL)}
            activeOpacity={0.85}
          >
            <Text style={styles.productCtaText}>Shop now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <View style={styles.productNameRow}>
              <Text style={styles.productName}>Monthly Subscription</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save $7/month</Text>
              </View>
            </View>
            <Text style={styles.productPrice}>$68/mo</Text>
          </View>
          <Text style={styles.productDesc}>Never run out. Cancel anytime.</Text>
          <TouchableOpacity
            style={styles.productCta}
            onPress={() => openShopify(SUB_URL)}
            activeOpacity={0.85}
          >
            <Text style={styles.productCtaText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        {/* Referral code */}
        <View style={styles.referralSection}>
          <Text style={styles.referralHeading}>Have a referral code?</Text>

          {savedCode && !editing ? (
            <View style={styles.savedCodeRow}>
              <Text style={styles.savedCodeText}>Your code: {savedCode}</Text>
              <TouchableOpacity onPress={() => { setEditing(true); setFeedback(null) }}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.codeInputRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="e.g. GYMGIRL20"
                placeholderTextColor="#6B6460"
                value={codeInput}
                onChangeText={setCodeInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
                onPress={applyCode}
                disabled={applying}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnText}>{applying ? '…' : 'Apply'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {feedback && (
            <View
              style={[
                styles.feedbackCard,
                feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedback.type === 'success' ? '#3D6B4A' : '#7A1E2E' },
                ]}
              >
                {feedback.msg}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Purchases are completed securely through our Shopify store. Your cycle data
          stays private in this app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E8' },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  header: { fontFamily: 'PlayfairDisplay', fontSize: 28, color: '#C9A84C' },

  calloutCard: { borderRadius: 16, borderLeftWidth: 4, padding: 18, gap: 8 },
  calloutHeading: { fontFamily: 'PlayfairDisplay', fontSize: 18, color: '#2C2825' },
  calloutSub: { fontFamily: 'Inter', fontSize: 13, color: '#6B6460' },
  calloutCta: {
    marginTop: 6, borderRadius: 12, paddingVertical: 12, alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 24,
  },
  calloutCtaText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  productCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, gap: 6,
    borderWidth: 1, borderColor: '#E8E2D6',
  },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productNameRow: { gap: 6, flex: 1 },
  productName: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700', color: '#2C2825' },
  productPrice: { fontFamily: 'JetBrainsMono', fontSize: 16, color: '#2C2825' },
  productDesc: { fontFamily: 'Inter', fontSize: 13, color: '#6B6460' },
  productSubtext: { fontFamily: 'Inter', fontSize: 12, color: '#6B6460' },
  saveBadge: {
    backgroundColor: '#C9A84C', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  saveBadgeText: { fontFamily: 'Inter', fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  productCta: {
    marginTop: 8, backgroundColor: '#2C2825', borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  productCtaText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  referralSection: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, gap: 12,
    borderWidth: 1, borderColor: '#E8E2D6',
  },
  referralHeading: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#2C2825' },
  savedCodeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedCodeText: { fontFamily: 'Inter', fontSize: 14, color: '#2C2825' },
  changeLink: { fontFamily: 'Inter', fontSize: 13, color: '#C9A84C', fontWeight: '600' },
  codeInputRow: { flexDirection: 'row', gap: 8 },
  codeInput: {
    flex: 1, backgroundColor: '#F5F0E8', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E2D6',
    paddingVertical: 12, paddingHorizontal: 14, fontFamily: 'Inter', fontSize: 14, color: '#2C2825',
  },
  applyBtn: {
    backgroundColor: '#2C2825', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center',
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  feedbackCard: { borderRadius: 12, padding: 12 },
  feedbackSuccess: { backgroundColor: '#E4EFE6' },
  feedbackError: { backgroundColor: '#F5E8EA' },
  feedbackText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '500' },

  footer: { fontFamily: 'Inter', fontSize: 11, color: '#6B6460', lineHeight: 16, marginTop: 4 },
})
