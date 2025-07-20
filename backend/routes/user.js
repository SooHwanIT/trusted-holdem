router.patch('/user/me', auth, async (req, res) => {
    const allow = ['nickname', 'avatarUrl'];   // 수정 허용 필드
    const updates = Object.fromEntries(
        Object.entries(req.body).filter(([k]) => allow.includes(k))
    );
    const user = await User.findByIdAndUpdate((req as any).user.id, updates, { new: true });
    res.json({ ok: true, user });
});



router.get('/user/me', auth, async (req, res) => {
    const user = await User.findById((req as any).user.id).lean();
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
    delete user.password;                     // 비밀번호 제거
    res.json(user);
});
