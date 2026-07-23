export default async function handler(req, res) {
    // 🔓 1. تفعيل CORS للسماح بالطلبات من أي موقع (مثل Awardspace)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 🛑 2. معالجة طلب الفحص التمهيدي من المتصفح (CORS Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'طريقة الطلب غير مسموح بها' });
    }

    // 📥 3. قراءة البيانات القادمة من الطلب
    const push_text = req.body.push_text || req.body.message;
    const sender = req.body.sender || req.body.title || 'مستخدم';
    const title = req.body.title || `رسالة جديدة من ${sender}`;

    if (!push_text || push_text.trim() === '') {
        return res.status(400).json({ error: '⚠️ الرجاء كتابة نص الإشعار أولاً!' });
    }

    // 🔑 4. التحقق من وجود مفاتيح OneSignal في متغيرات البيئة
    const appId = (process.env.ONESIGNAL_APP_ID || '').trim();
    const apiKey = (process.env.ONESIGNAL_REST_API_KEY || '').trim();

    if (!appId || !apiKey) {
        return res.status(500).json({
            success: false,
            error: '❌ المفاتيح غير موجودة في Vercel!'
        });
    }

    try {
        // 🚀 5. إرسال الإشعار إلى OneSignal API
        const response = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Key ${apiKey}`
            },
            body: JSON.stringify({
                app_id: appId,
                included_segments: ['All'],
                contents: { 
                    ar: push_text, 
                    en: push_text 
                },
                headings: { 
                    ar: title, 
                    en: title 
                },

                // 🌟 تجميع إشعارات نفس المرسل في مجموعة واحدة دون حذف الرسائل القديمة
                android_group: `group_${sender}`,
                android_group_message: { 
                    ar: `$[notif_count] رسائل جديدة من ${sender}`,
                    en: `$[notif_count] new messages from ${sender}`
                }
            })
        });

        const data = await response.json();

        if (response.ok && !data.errors) {
            return res.status(200).json({
                success: true,
                message: '✅ تم إرسال الإشعار بنجاح!',
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
