import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default openai

export const correctTextWithGPT = async (text: string, corrections?: { [key: string]: string }): Promise<string> => {
  try {
    let prompt = `다음 텍스트를 맞춤법과 문법에 맞게 교정해주세요. 원래 의미를 유지하면서 자연스럽게 수정해주세요:\n\n${text}`

    if (corrections && Object.keys(corrections).length > 0) {
      const correctionRules = Object.entries(corrections)
        .map(([wrong, correct]) => `${wrong} → ${correct}`)
        .join('\n')
      prompt = `다음 교정 규칙을 적용하여 텍스트를 수정해주세요:\n\n교정 규칙:\n${correctionRules}\n\n원본 텍스트:\n${text}`
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 전문적인 한국어 편집자입니다. 텍스트를 맞춤법과 문법에 맞게 자연스럽게 교정해주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    })

    return response.choices[0]?.message?.content?.trim() || text
  } catch (error) {
    console.error('GPT 교정 중 오류 발생:', error)
    throw new Error('텍스트 교정에 실패했습니다.')
  }
}
