export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'طريقة الطلب غير مسموح بها' });
    }

    const { push_text } = req.body;

    if (!push_text || push_text.trim() === '') {
        return res.status(400).json({ error: '⚠️ الرجاء كتابة نص الإشعار أولاً!' });
    }

    // جلب المفاتيح من Vercel
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    // فحص تشخيصي: هل المفاتيح متوفرة داخل Vercel؟
    if (!appId || !apiKey) {
        return res.status(500).json({
            success: false,
            error: 'لم يتم قراءة المفاتيح من Vercel!',
            details: {
                appId_exists: !!appId,
                apiKey_exists: !!apiKey,
                tip: 'تأكد من إضافة المتغيرات في Vercel ثم عمل Redeploy للمشروع.'
            }
        });
    }

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Key ${apiKey.trim()}`
            },
            body: JSON.stringify({
                app_id: appId.trim(),
                included_segments: ['All'],
                contents: {
                    ar: push_text,
                    en: push_text
                },
                headings: {
                    ar: "إشعار تجريبي 🚀",
                    en: "Test Notification 🚀"
                }
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
