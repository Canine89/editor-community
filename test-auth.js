// 사용자 인증 및 게시글 작성 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obmtqjrmyfiicfjjrwfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibXRxanJteWZpaWNmampyd2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MjcyOTQsImV4cCI6MjA3MjUwMzI5NH0.btoTdUOsHl9uP9lmQPqIraiddgMUO547J2OM_9_wQC8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAndPost() {
  try {
    console.log('🔐 사용자 인증 및 게시글 작성 테스트 중...');

    // 1. 이메일로 사용자 등록
    const testEmail = 'test@example.com';
    const testPassword = 'test123456';

    console.log('📧 사용자 등록 시도...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ 사용자가 이미 존재합니다. 로그인 시도...');

        // 이미 존재하는 사용자로 로그인
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        if (signInError) {
          console.error('❌ 로그인 실패:', signInError);
          return;
        }

        console.log('✅ 로그인 성공:', signInData.user?.email);
        user = signInData.user;

      } else {
        console.error('❌ 사용자 등록 실패:', signUpError);
        return;
      }
    } else {
      console.log('✅ 사용자 등록 성공:', signUpData.user?.email);
      user = signUpData.user;
    }

    // 잠시 기다렸다가 세션 확인
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 현재 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ 세션 확인 실패:', sessionError);
      return;
    }

    if (!session) {
      console.error('❌ 세션이 존재하지 않습니다');
      return;
    }

    console.log('✅ 세션 확인 성공, 사용자 ID:', session.user.id);

    // 2. 게시판 ID 가져오기
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('type', 'anonymous')
      .single();

    if (boardError) {
      console.error('❌ 게시판 조회 실패:', boardError);
      return;
    }

    // 3. 인증된 사용자로 게시글 작성
    const testPost = {
      board_id: board.id,
      author_id: session.user.id,
      is_anonymous: true,
      title: '인증된 사용자의 테스트 게시글',
      body: '안녕하세요! 이제 인증된 사용자로 게시글을 작성합니다. RLS 정책이 제대로 작동하는지 확인해보겠습니다.'
    };

    console.log('📝 게시글 작성 시도...');
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert(testPost)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 게시글 작성 실패:', insertError);
    } else {
      console.log('✅ 게시글 작성 성공:', newPost.title);
    }

    // 4. 게시글 목록 조회
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        body,
        is_anonymous,
        created_at,
        boards (
          name,
          type
        )
      `)
      .eq('board_id', board.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('❌ 게시글 목록 조회 실패:', postsError);
    } else {
      console.log('✅ 게시글 목록 조회 성공 (총', posts.length, '개):');
      posts.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.title} (${post.is_anonymous ? '익명' : '실명'})`);
        console.log(`     내용: ${post.body.substring(0, 50)}...`);
      });
    }

    console.log('🎉 인증 및 게시글 작성 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testAuthAndPost();
