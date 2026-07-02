import React from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism } from '../../generators/registry';
import { Scissors, Palette, Tent, HelpCircle } from 'lucide-react';

export default function Instructions() {
  const { cardParams } = useCardStore();

  if (!cardParams) {
    return (
      <div className="preview-content" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        도안 생성을 완료하면 이곳에 조립 설명서가 나타납니다.
      </div>
    );
  }

  const renderSteps = () => {
    const instructionStyle = getMechanism(cardParams.mechanism)?.instructionStyle;

    switch (instructionStyle) {
      case 'straw-rocket':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>오리기</h4>
                <p>검은색 실선을 따라 튜브 모양과 장식 그림을 조심해서 오려주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="20" y="10" width="20" height="40" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <circle cx="70" cy="30" r="15" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <path d="M10 50 L30 30 M30 50 L10 30" stroke="var(--primary-main)" strokeWidth="2" /> {/* Scissors */}
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>튜브 말아 붙이기</h4>
                <p>가장 긴 네모(튜브)를 둥글게 말아서 '풀칠' 부분에 풀이나 양면테이프를 발라 원통 모양으로 붙여주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* Isometric cylinder representing rolled tube */}
                    <ellipse cx="50" cy="15" rx="15" ry="5" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M35 15 L35 45 A15 5 0 0 0 65 45 L65 15 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <ellipse cx="50" cy="45" rx="15" ry="5" fill="none" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M40 30 L60 30" stroke="var(--primary-main)" strokeWidth="2" strokeDasharray="2 2" /> {/* Glue indicator */}
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>윗부분 막기</h4>
                <p>튜브 위쪽의 작은 날개를 산접기(빨간 점선)하여 뚜껑을 덮듯 풀칠해 막아주세요. (바람이 새지 않게 꼼꼼히!)</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M35 25 L35 55 A15 5 0 0 0 65 55 L65 25 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <ellipse cx="50" cy="25" rx="15" ry="5" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" /> {/* Closed top */}
                    <path d="M50 15 L50 25" stroke="red" strokeWidth="2" /> {/* Arrow pointing down */}
                    <path d="M45 20 L50 25 L55 20" fill="none" stroke="red" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>장식 붙이고 날리기!</h4>
                <p>완성된 튜브 앞/뒷면에 장식을 붙인 후, 아래 뚫린 구멍으로 일반 빨대를 꽂고 후~ 불어보세요!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="160" viewBox="0 0 100 80" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* Straw */}
                    <path d="M50 40 L50 75" stroke="var(--primary-main)" strokeWidth="4" />
                    {/* Tube flying off */}
                    <path d="M35 15 L35 35 A15 5 0 0 0 65 35 L65 15 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <ellipse cx="50" cy="15" rx="15" ry="5" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1" />
                    {/* Decoration star */}
                    <path d="M50 20 L53 27 L60 27 L55 32 L57 39 L50 35 L43 39 L45 32 L40 27 L47 27 Z" fill="gold" stroke="orange" strokeWidth="1" />
                    {/* Air lines */}
                    <path d="M30 50 Q 20 40 30 30" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="3 3" />
                    <path d="M70 50 Q 80 40 70 30" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="3 3" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );
      
      case 'accordion':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>지그재그 띠 오리기</h4>
                <p>검은색 실선을 따라 띠를 오려주세요. 위아래 초록색(풀칠) 부분은 자르지 말고 남겨둡니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="35" y="6" width="30" height="48" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <rect x="35" y="6" width="30" height="8" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <rect x="35" y="46" width="30" height="8" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <path d="M10 50 L30 30 M30 50 L10 30" stroke="var(--primary-main)" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>병풍처럼 접기</h4>
                <p>빨간 점선은 산접기, 파란 점선은 골접기로 번갈아 접어 지그재그를 만드세요. 붙이기 전에 반대 방향으로도 한 번 살짝 접어두면 잘 펴집니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="100" viewBox="0 0 120 40" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <path d="M10 30 L25 10 L40 30 L55 10 L70 30 L85 10 L100 30" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M25 10 L25 6 M55 10 L55 6 M85 10 L85 6" stroke="red" strokeWidth="1.5" />
                    <path d="M40 30 L40 34 M70 30 L70 34" stroke="blue" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>양 끝만 붙이기</h4>
                <p>카드를 반쯤 연 상태에서 위 '풀칠' 칸은 위 종이면에, 아래 '풀칠' 칸은 아래 종이면에 붙이세요. 가운데는 붙이지 마세요! 카드를 열면 병풍이 짠 하고 섭니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="140" viewBox="0 0 100 70" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M15 20 L50 40 L85 20" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M28 30 L38 15 L48 33 L58 15 L68 33 L72 27" fill="none" stroke="var(--primary-main)" strokeWidth="2" />
                    <circle cx="28" cy="30" r="2.5" fill="green" />
                    <circle cx="72" cy="27" r="2.5" fill="green" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'volvelle':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>동그란 판 4개 오리기</h4>
                <p>덮개·돌림판·간격 링·뒷판을 실선대로 오려주세요. 덮개의 창문 구멍과 손잡이 홈도 함께 오려냅니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <circle cx="30" cy="30" r="22" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M30 30 L22 10 A22 22 0 0 1 38 10 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M23 50 A22 22 0 0 0 37 50 L34 44 A14 14 0 0 1 26 44 Z" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <circle cx="85" cy="30" r="18" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M85 30 L85 12 M85 30 L100 38 M85 30 L70 38" stroke="var(--text-primary)" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>뒷판 + 간격 링 붙이기</h4>
                <p>뒷판 위에 간격 링을 겹쳐 초록색 테두리끼리 붙이세요. 가운데 구멍은 뚫린 채로 둡니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="50" cy="30" r="24" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <circle cx="50" cy="30" r="24" fill="none" stroke="green" strokeWidth="2" strokeDasharray="2 2" />
                    <circle cx="50" cy="30" r="16" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>돌림판은 끼우기만! (붙이지 마세요)</h4>
                <p>그림을 그린 돌림판을 링 구멍 안에 살짝 끼워 넣습니다. 이 판은 절대 풀로 붙이지 마세요. 붙이면 돌아가지 않아요!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="50" cy="30" r="24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" />
                    <circle cx="50" cy="30" r="15" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1.5" />
                    <path d="M35 30 A15 15 0 0 1 65 30" fill="none" stroke="var(--primary-main)" strokeWidth="1.5" markerEnd="url(#none)" />
                    <path d="M63 26 L66 30 L60 31 Z" fill="var(--primary-main)" />
                    <text x="50" y="55" fontSize="8" textAnchor="middle" fill="red">풀칠 금지!</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>덮개 덮고 돌려보기</h4>
                <p>덮개를 맨 위에 덮어 테두리만 붙이세요. 손잡이 홈으로 돌림판 가장자리를 밀면 창문 속 그림이 바뀝니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="50" cy="30" r="24" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M50 30 L42 10 A24 24 0 0 1 58 10 Z" fill="gold" stroke="orange" strokeWidth="1" />
                    <path d="M40 52 A24 24 0 0 0 60 52 L56 45 A17 17 0 0 1 44 45 Z" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M30 45 Q24 40 30 35" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeDasharray="2 2" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'generic':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>오리기</h4>
                <p>검은색 실선을 따라 팝업 조각들을 모두 오려주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="20" y="10" width="60" height="40" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <path d="M10 50 L30 30 M30 50 L10 30" stroke="var(--primary-main)" strokeWidth="2" /> {/* Scissors icon hint */}
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>접기</h4>
                <p>빨간 점선은 산접기(볼록하게), 파란 점선은 골접기(오목하게) 해줍니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                  <svg width="120" height="80" viewBox="0 0 60 40" style={{ width: '45%', maxWidth: '150px', height: 'auto' }}>
                    <path d="M10 30 L30 10 L50 30" fill="none" stroke="red" strokeWidth="2" strokeDasharray="5 5" />
                    <text x="30" y="38" fontSize="10" textAnchor="middle" fill="var(--text-primary)">산접기(Mountain)</text>
                  </svg>
                  <svg width="120" height="80" viewBox="0 0 60 40" style={{ width: '45%', maxWidth: '150px', height: 'auto' }}>
                    <path d="M10 10 L30 30 L50 10" fill="none" stroke="blue" strokeWidth="2" strokeDasharray="5 5" />
                    <text x="30" y="38" fontSize="10" textAnchor="middle" fill="var(--text-primary)">골접기(Valley)</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>풀칠하여 조립하기</h4>
                <p>안내된 풀칠 기호에 맞춰 배경 카드에 팝업 조각을 붙여주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="160" viewBox="0 0 100 80" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* Isometric card open */}
                    <path d="M20 60 L50 75 L80 60 L50 10 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M20 60 L50 75 L50 45 L20 30 Z" fill="rgba(0,0,0,0.05)" stroke="var(--text-primary)" strokeWidth="1" />
                    {/* Pop-up mechanism abstract */}
                    <path d="M40 50 L60 60 L60 30 L40 20 Z" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return <p>설명서가 준비되지 않은 메커니즘입니다.</p>;
    }
  };

  return (
    <div className="preview-content" style={{ overflowY: 'auto', padding: 'var(--space-xl)' }}>
      <h3 style={{ marginBottom: 'var(--space-lg)' }}>{cardParams.theme} - 조립 설명서</h3>
      <div className="instructions-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {renderSteps()}
      </div>
    </div>
  );
}
