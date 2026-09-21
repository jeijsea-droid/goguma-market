-- 장터를 눈으로 보려고 깔아 둔 샘플 물건 스무 가지.
--
-- migrations 가 아니라 seed 에 둔 까닭:
--   migrations 는 "표의 생김새"를 바꾸는 일이라 한 번만 돌아야 하고 되돌릴 수도 있어야 합니다.
--   이건 그냥 "들어 있는 내용"이라 지워도 그만이고, 필요하면 몇 번이든 다시 깔면 됩니다.
--   같은 제목이 이미 있으면 건너뛰므로 두 번 돌려도 스무 개가 마흔 개가 되지는 않습니다.
--
-- 파는 사람은 시험용 계정(고구마시험) 하나로 몰아 두었습니다.
-- 진짜로 쓰시는 계정에 가짜 물건이 붙지 않게 일부러 그리 했습니다.
--
-- 여러 사람이 내놓은 것처럼 보이게 하려면, 아래 where 절의 닉네임을 바꿔
-- 몇 줄씩 나누어 돌리면 됩니다. 이를테면 뒤쪽 열 가지만 다른 사람 앞으로:
--   update public.goguma_items
--      set seller_id = (select id from public.goguma_profiles where nickname = '김부장')
--    where title in ('요가매트 6mm (거의 새 것)', '해남 꿀고구마 5kg (직접 캔 것)');
--
-- 싹 걷어 내려면:
--   delete from public.goguma_items;

insert into public.goguma_items
  (seller_id, title, body, price, category, region, status, created_at, updated_at)
select p.id, v.title, v.body, v.price, v.category, v.region, v.status,
       now() - v.ago, now() - v.ago
from public.goguma_profiles p
cross join (values
  ('아이패드 9세대 64GB 와이파이', E'작년에 인강용으로 샀다가 거의 안 썼습니다.\n액정 필름 붙여 뒀고 케이스 같이 드려요. 충전기 있습니다.', 230000, '디지털기기', '서울 관악구 신림동', 'selling', interval '12 minutes'),
  ('로지텍 MX Master 3 마우스', E'손이 작아서 안 맞아 내놓습니다. 클릭 이상 없고 휠도 멀쩡해요.', 55000, '디지털기기', '서울 관악구 봉천동', 'selling', interval '48 minutes'),
  ('LG 퓨리케어 공기청정기 AS120', E'이사 가면서 정리합니다. 필터는 지난달에 갈았어요.\n무거워서 직접 가져가실 분만요.', 90000, '생활가전', '서울 동작구 상도동', 'reserved', interval '3 hours'),
  ('발뮤다 토스터 (박스 있음)', E'선물 받았는데 빵을 잘 안 먹네요. 두어 번 구워 봤습니다.\n박스, 설명서 다 있습니다.', 120000, '생활가전', '서울 관악구 서원동', 'selling', interval '5 hours'),
  ('이케아 말름 서랍장 3단 화이트', E'윗면에 컵 자국 하나 있습니다. 서랍은 부드럽게 열려요.', 40000, '가구·인테리어', '서울 금천구 독산동', 'selling', interval '8 hours'),
  ('원목 4인용 식탁 (의자 2개 포함)', E'삼 년 썼습니다. 흔들림 없고 다리 튼튼해요.\n용달 부르셔야 합니다.', 150000, '가구·인테리어', '경기 광명시 철산동', 'sold', interval '11 hours'),
  ('코렐 그릇 세트 12P', E'이 빠진 것 없이 열두 장 그대로입니다.', 18000, '생활용품', '서울 관악구 신림동', 'selling', interval '14 hours'),
  ('다이슨 청소기 거치대 (미사용)', E'본체를 중고로 사면서 같이 왔는데 벽에 못 박기가 싫어서요. 뜯지도 않았습니다.', 25000, '생활용품', '서울 동작구 사당동', 'selling', interval '20 hours'),
  ('유니클로 경량 패딩 남성 L', E'작년 겨울에 몇 번 입었습니다. 세탁해서 보관했어요.', 20000, '의류', '서울 관악구 낙성대동', 'selling', interval '26 hours'),
  ('나이키 후드집업 M (한두 번 입음)', E'사이즈를 잘못 샀습니다. 택은 뗐지만 거의 새 것이에요.', 35000, '의류', '서울 서초구 방배동', 'reserved', interval '30 hours'),
  ('다이슨 에어랩 멀티스타일러', E'머리를 짧게 자르면서 쓸 일이 없어졌습니다.\n노즐 전부 있고 정품 케이스에 담아 드려요.', 380000, '뷰티·미용', '서울 강남구 역삼동', 'selling', interval '2 days'),
  ('밀리의 서재 1년 이용권 양도', E'열 달 남았습니다. 계정 이전 방식으로 넘겨 드려요.', 60000, '도서·티켓', '온라인 거래', 'selling', interval '2 days 4 hours'),
  ('헤르만 헤세 전집 12권', E'책장 정리합니다. 밑줄 없고 누런 자국만 조금 있어요.\n열두 권 한 번에 가져가실 분 찾습니다.', 45000, '도서·티켓', '서울 관악구 청룡동', 'selling', interval '3 days'),
  ('닌텐도 스위치 OLED + 게임 3장', E'마리오카트, 젤다, 동물의 숲 같이 드립니다.\n조이콘 쏠림 없습니다.', 290000, '취미·게임', '서울 동작구 흑석동', 'selling', interval '3 days 6 hours'),
  ('레고 크리에이터 10281 분재', E'조립해서 올려만 뒀습니다. 부품 빠진 것 없고 설명서 있어요.', 38000, '취미·게임', '서울 관악구 신림동', 'sold', interval '4 days'),
  ('다이와 낚시대 세트 (초보자용)', E'두 번 나가 보고 접었습니다. 릴, 가방까지 한 벌이에요.', 70000, '스포츠·레저', '경기 안양시 만안구', 'selling', interval '5 days'),
  ('요가매트 6mm (거의 새 것)', E'작심삼일이었습니다. 그냥 가져가세요.', 0, '스포츠·레저', '서울 관악구 조원동', 'selling', interval '6 days'),
  ('아기 바운서 (6개월 사용)', E'아이가 커서 이제 안 씁니다. 커버는 분리해서 빨아 뒀어요.', 30000, '유아동', '서울 금천구 시흥동', 'selling', interval '8 days'),
  ('고양이 원목 캣타워 대형', E'우리 애가 안 올라가네요. 흠집 조금 있습니다.\n부피가 커서 차 가져오셔야 해요. 나눔합니다.', 0, '반려동물', '서울 동작구 대방동', 'reserved', interval '11 days'),
  ('해남 꿀고구마 5kg (직접 캔 것)', E'밭에서 이번 주에 캤습니다. 굽거나 쪄서 드시면 좋아요.\n택배도 가능합니다.', 15000, '식품', '전남 해남군', 'selling', interval '14 days')
) as v(title, body, price, category, region, status, ago)
where p.nickname = '고구마시험'
  and not exists (select 1 from public.goguma_items i where i.title = v.title);
