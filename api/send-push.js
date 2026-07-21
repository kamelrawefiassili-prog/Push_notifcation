export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'طريقة الطلب غير مسموح بها' });
    }

    const { push_text } = req.body;

    if (!push_text || push_text.trim() === '') {
        return res.status(400).json({ error: '⚠️ الرجاء كتابة نص الإشعار أولاً!' });
    }

    // جلب المفاتيح وتنظيفها من أي مسافات زائدة
    const appId = (process.env.ONESIGNAL_APP_ID || '').trim();
    const apiKey = (process.env.ONESIGNAL_REST_API_KEY || '').trim();

    // فحص وجود المفاتيح
    if (!appId || !apiKey) {
        return res.status(500).json({
            success: false,
            error: '❌ المفاتيح غير موجودة في Vercel!',
            details: {
                appId_found: !!appId,
                apiKey_found: !!apiKey,
                tip: 'تأكد من إضافة المتغيرات في Environment Variables في Vercel ثم عمل Redeploy.'
            }
        });
    }

    // تجهيز معاينة آمنة للمفتاح للتشخيص
    const maskedKey = apiKey.length > 10 ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'مفتاح قصير جداً';

    // دالة مساعدة للإرسال بصيغة محددة
    const sendNotification = async (authPrefix) => {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `${authPrefix} ${apiKey}`
            },
            body: JSON.stringify({
                app_id: appId,
                included_segments: ['All'],
                contents: { ar: push_text, en: push_text },
                headings: { ar: "إشعار تجريبي 🚀", en: "Test Notification 🚀" }
            })
        });
        const data = await response.json();
        return { status: response.status, ok: response.ok, data, authPrefix };
    };

    try {
        // المحاولة الأولى: استخدام Key
        let result = await sendNotification('Key');

        // إذا رفض السيرفر بسبب التوثيق، نجرب المحاولة الثانية: استخدام Basic
        if (!result.ok && JSON.stringify(result.data).includes('Access denied')) {
            result = await sendNotification('Basic');
        }

        if (result.ok && !result.data.errors) {
            return res.status(200).json({
                success: true,
                message: `✅ تم إرسال الإشعار بنجاح عبر (${result.authPrefix})! راجع هاتفك الآن.`,
                data: result.data
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'رفض سيرفر OneSignal الطلب',
                diagnostics: {
                    appId_used: appId,
                    apiKey_preview: maskedKey,
                    key_length: apiKey.length,
                    auth_prefix_tried: result.authPrefix
                },
                details: result.data
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'خطأ في الاتصال بالشبكة',
            details: error.message
        });
    }
}
