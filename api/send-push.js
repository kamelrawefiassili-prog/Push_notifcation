export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'طريقة الطلب غير مسموح بها' });
    }

    const { push_text } = req.body;

    if (!push_text || push_text.trim() === '') {
        return res.status(400).json({ error: '⚠️ الرجاء كتابة نص الإشعار أولاً!' });
    }

    // إعدادات OneSignal
    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || 'b9932e55-c55b-465d-b021-39a034f978e0';
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || 'os_v2_app_xgjs4voflndf3mbbhgqdj6ly5b3iucz7uczustvox2hrsnmfyzljor7jo4cgpfsxwwklng7bi4cvh7kkbgrfexpqnzi2ntiymy6vxmi';

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                // ترويسة التوثيق الصحيحة لمفاتيح v2 في OneSignal
                'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
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
