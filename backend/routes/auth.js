router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.compare(password)))
        return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const token = sign({ id: user._id, email: user.email });
    res.json({ token });
});


router.post('/auth/register', async (req, res) => {
    const { email, password, nickname, wallet } = req.body;
    if (!email || !password || !wallet)
        return res.status(400).json({ error: 'REQUIRED' });

    if (await User.findOne({ email })) return res.status(409).json({ error: 'DUPLICATE_EMAIL' });

    const user = await User.create({ email, password, nickname, wallet });
    const token = sign({ id: user._id, email: user.email });
    res.status(201).json({ token });
});
