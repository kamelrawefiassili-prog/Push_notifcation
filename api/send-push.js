export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'طريقة الطلب غير مسموح بها' });
    }

    const { push_text } = req.body;

    if (!push_text || push_text.trim() === '') {
        return res.status(400).json({ error: '⚠️ الرجاء كتابة نص الإشعار أولاً!' });
    }

    const appId = (process.env.ONESIGNAL_APP_ID || '').trim();
    const apiKey = (process.env.ONESIGNAL_REST_API_KEY || '').trim();

    if (!appId || !apiKey) {
        return res.status(500).json({
            success: false,
            error: '❌ المفاتيح غير موجودة في Vercel!'
        });
    }

    try {
        // استخدام رابط API الحديث الموصى به في التوثيق
        const response = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Key ${apiKey}`
            },
            body: JSON.stringify({
                app_id: appId,
                included_segments: ['All'],
                contents: { ar: push_text, en: push_text },
                headings: { ar: "إشعار تجريبي 🚀", en: "Test Notification 🚀" }
            })
        });

        const data = await response.json();

        if (response.ok && !data.errors) {
            return res.status(200).json({
                success: true,
                message: '✅ تم إرسال الإشعار بنجاح! راجع هاتفك الآن.',
                data: data
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'رفض سيرفر OneSignal الطلب',
                details: data
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
