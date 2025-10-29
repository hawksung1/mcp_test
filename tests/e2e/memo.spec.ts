import { test, expect } from '@playwright/test'

// 공통: 각 테스트 시작 전에 로컬스토리지 초기화하여 시드 데이터/잔여 데이터 제거
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.clear())
})

test.describe('메모 앱 주요 기능', () => {
  test('메모 생성 및 목록 표시, 새로고침 후에도 유지', async ({ page }) => {
    await page.goto('/')

    // 상단 버튼 "새 메모" 클릭하여 폼 오픈
    await page.getByRole('button', { name: '새 메모' }).click()

    // 제목 입력
    await page.getByLabel('제목 *').fill('테스트 메모')

    // 카테고리 선택 (개인)
    await page.getByLabel('카테고리').selectOption('personal')

    // 내용(MDEditor) 입력: @uiw/react-md-editor의 입력 영역 클래스 사용
    const editor = page.locator('.w-md-editor-text-input').first()
    await editor.click()
    await editor.fill('이것은 테스트 내용입니다.')

    // 저장하기
    await page.getByRole('button', { name: '저장하기' }).click()

    // 카드 목록에서 제목이 보이는지 확인
    await expect(page.getByRole('heading', { name: '테스트 메모' })).toBeVisible()

    // 새로고침 후에도 존재해야 함(로컬스토리지 저장 확인)
    await page.reload()
    await expect(page.getByRole('heading', { name: '테스트 메모' })).toBeVisible()
  })

  test('상세 보기에서 편집 및 저장 반영', async ({ page }) => {
    await page.goto('/')

    // 메모 하나 생성
    await page.getByRole('button', { name: '새 메모' }).click()
    await page.getByLabel('제목 *').fill('편집 테스트')
    const editor = page.locator('.w-md-editor-text-input').first()
    await editor.click()
    await editor.fill('원본 내용')
    await page.getByRole('button', { name: '저장하기' }).click()

    // 카드 클릭하여 상세 모달 오픈
    await page.getByRole('heading', { name: '편집 테스트' }).click()

    // 편집 버튼 클릭 후 제목/내용 수정
    await page.getByTitle('편집').click()
    const titleInput = page.getByPlaceholder('제목')
    await titleInput.fill('편집된 제목')
    const detailEditor = page.locator('.w-md-editor-text-input').first()
    await detailEditor.click()
    await detailEditor.fill('수정된 내용')

    // 저장
    await page.getByRole('button', { name: '저장' }).click()

    // 모달에서 제목이 갱신되었는지 확인
    await expect(page.getByRole('heading', { name: '편집된 제목' })).toBeVisible()

    // 모달 닫기
    await page.getByTitle('닫기').click()

    // 카드에서도 수정된 제목 표시
    await expect(page.getByRole('heading', { name: '편집된 제목' })).toBeVisible()
  })

  test('상세 보기에서 삭제 확인 다이얼로그 거쳐 삭제', async ({ page }) => {
    await page.goto('/')

    // 메모 하나 생성
    await page.getByRole('button', { name: '새 메모' }).click()
    await page.getByLabel('제목 *').fill('삭제 대상 메모')
    const editor = page.locator('.w-md-editor-text-input').first()
    await editor.click()
    await editor.fill('삭제 테스트 내용')
    await page.getByRole('button', { name: '저장하기' }).click()

    // 상세 열기
    await page.getByRole('heading', { name: '삭제 대상 메모' }).click()

    // 삭제 버튼 -> 확인 다이얼로그 -> 삭제 버튼
    await page.getByTitle('삭제').click()
    await page.getByRole('button', { name: '삭제' }).click()

    // 모달이 닫히고 카드가 목록에서 사라졌는지 확인
    await expect(page.getByRole('heading', { name: '삭제 대상 메모' })).toHaveCount(0)
  })

  test('검색 및 카테고리 필터 동작', async ({ page }) => {
    await page.goto('/')

    // 2개의 메모 생성: 서로 다른 제목/카테고리
    // 메모 A (personal)
    await page.getByRole('button', { name: '새 메모' }).click()
    await page.getByLabel('제목 *').fill('고양이 일기')
    await page.getByLabel('카테고리').selectOption('personal')
    await page.locator('.w-md-editor-text-input').first().fill('고양이')
    await page.getByRole('button', { name: '저장하기' }).click()

    // 메모 B (work)
    await page.getByRole('button', { name: '새 메모' }).click()
    await page.getByLabel('제목 *').fill('업무 보고')
    await page.getByLabel('카테고리').selectOption('work')
    await page.locator('.w-md-editor-text-input').first().fill('보고')
    await page.getByRole('button', { name: '저장하기' }).click()

    // 검색: "고양이" -> 고양이 일기만 남음
    await page.getByPlaceholder('메모 검색...').fill('고양이')
    await expect(page.getByRole('heading', { name: '고양이 일기' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '업무 보고' })).toHaveCount(0)

    // 필터 초기화 클릭
    await page.getByRole('button', { name: '필터 초기화' }).click()

    // 카테고리 필터: work만
    await page.getByDisplayValue('전체 카테고리').selectOption('work')
    await expect(page.getByRole('heading', { name: '업무 보고' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '고양이 일기' })).toHaveCount(0)
  })
})



