// カテゴリー定義オブジェクト
const CATEGORIES = {
    positions: [
        'すべて',
        '取締役/CxO・本部長',
        'シニアマネージャー（部長）',
        'グループリーダー/マネージャー（係長・課長）',
        '一般社員（社員・主任）',
        'その他（契約社員/パートアルバイト）'
    ],

    departmentCategories: [
        'すべて',
        '経営陣',
        '社内管理',
        '営業/マーケ',
        '生産開発',
        'その他'
    ],

    jobTypes: [
        'すべて',
        '経営企画',
        '経理・財務',
        '人事',
        '総務',
        '法務',
        '広報・コミュニケーション',
        'システムソリューション',
        'ソリューション企画',
        'マーケティング',
        '営業',
        '営業推進',
        '販売促進',
        '業務',
        '購買',
        '製造・生産管理',
        '研究・技術/製品開発',
        'ビジネスイノベーション・新規事業開発',
        'その他'
    ]
};

// 曖昧マッチング関数
function findBestMatch(ocrText, categories) {
    const matches = [];

    categories.forEach(category => {
        // 完全一致
        if (ocrText.includes(category)) {
            matches.push({
                category: category,
                score: 100,
                type: 'exact'
            });
            return;
        }
    
        // 部分一致（複合語を分割してチェック）
        const keywords = category.split(/[/・（）]/);
        keywords.forEach(keyword => {
            keyword = keyword.trim();
            if (keyword.length > 1 && ocrText.includes(keyword)) {
                matches.push({
                    category: category,
                    score: 80,
                    type: 'partial',
                    keyword: keyword
                });
            }
        });
        
        // より柔軟な部分一致（カタカナ、ひらがな混在対応）
        const cleanCategory = category.replace(/[/・（）]/g, '');
        if (cleanCategory.length > 2 && ocrText.includes(cleanCategory)) {
            matches.push({
                category: category,
                score: 70,
                type: 'flexible'
            });
        }
    });
    
    // スコア順にソート
    const sortedMatches = matches.sort((a, b) => b.score - a.score);
    return sortedMatches.length > 0 ? sortedMatches[0] : null;
}

// 企業名の動的抽出
function extractCompanyName(ocrText) {
    const companyPatterns = [
        /株式会社[^\s\n【】\[\]]+/g,
        /[^\s\n【】\[\]]+株式会社/g,
        /有限会社[^\s\n【】\[\]]+/g,
        /[^\s\n【】\[\]]+有限会社/g,
        /[^\s\n【】\[\]]+会社/g
    ];
    
    for (const pattern of companyPatterns) {
        const matches = ocrText.match(pattern);
        if (matches && matches.length > 0) {
            // 最も長い（詳細な）企業名を選択
            const longestMatch = matches.reduce((longest, current) => 
                current.length > longest.length ? current : longest
            );
            return longestMatch.trim();
        }
    }
    return '';
}

// カテゴリー解析のメイン関数
function parseCategories(ocrText) {
    const result = {
        position: '',
        departmentCategory: '',
        jobType: '',
        companyName: '',
        confidence: {
            position: 0,
            departmentCategory: 0,
            jobType: 0,
            companyName: 0
        }
    };
    
    // 職位の解析
    const positionMatch = findBestMatch(ocrText, CATEGORIES.positions);
    if (positionMatch) {
        result.position = positionMatch.category;
        result.confidence.position = positionMatch.score;
    }
    
    // 職種大分類の解析
    const departmentMatch = findBestMatch(ocrText, CATEGORIES.departmentCategories);
    if (departmentMatch) {
        result.departmentCategory = departmentMatch.category;
        result.confidence.departmentCategory = departmentMatch.score;
    }
    
    // 職種の解析
    const jobTypeMatch = findBestMatch(ocrText, CATEGORIES.jobTypes);
    if (jobTypeMatch) {
        result.jobType = jobTypeMatch.category;
        result.confidence.jobType = jobTypeMatch.score;
    }
    
    // 企業名の解析
    const companyName = extractCompanyName(ocrText);
    if (companyName) {
        result.companyName = companyName;
        result.confidence.companyName = 90; // 企業名パターンマッチの信頼度
    }
    
    return result;
}

// デバッグ用関数
function debugCategoryMatching(ocrText) {
    console.log('=== カテゴリー解析デバッグ ===');
    console.log('OCRテキスト:', ocrText);
    
    const result = parseCategories(ocrText);
    console.log('解析結果:', result);
    
    // 各カテゴリーの詳細マッチング結果
    console.log('職位マッチング:', findBestMatch(ocrText, CATEGORIES.positions));
    console.log('職種大分類マッチング:', findBestMatch(ocrText, CATEGORIES.departmentCategories));
    console.log('職種マッチング:', findBestMatch(ocrText, CATEGORIES.jobTypes));
    console.log('企業名抽出:', extractCompanyName(ocrText));
    
    return result;
}

// モジュールエクスポート（ブラウザ環境用）
if (typeof window !== 'undefined') {
    window.CATEGORIES = CATEGORIES;
    window.findBestMatch = findBestMatch;
    window.extractCompanyName = extractCompanyName;
    window.parseCategories = parseCategories;
    window.debugCategoryMatching = debugCategoryMatching;
}